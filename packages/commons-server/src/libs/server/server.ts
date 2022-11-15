import {
  BINARY_BODY,
  BodyTypes,
  CommonsTexts,
  CORSHeaders,
  Environment,
  GetContentType,
  GetRouteResponseContentType,
  Header,
  IsValidURL,
  MimeTypesWithTemplating,
  MockoonServerOptions,
  ProcessedDatabucket,
  Route,
  RouteResponse,
  ServerErrorCodes,
  ServerEvents
} from '@mockoon/commons';
import appendField from 'append-field';
import busboy from 'busboy';
import cookieParser from 'cookie-parser';
import { EventEmitter } from 'events';
import express, { Application, NextFunction, Request, Response } from 'express';
import { createReadStream, readFile, readFileSync, statSync } from 'fs';
import type { RequestListener } from 'http';
import { createServer as httpCreateServer, Server as httpServer } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import {
  createServer as httpsCreateServer,
  Server as httpsServer
} from 'https';
import killable from 'killable';
import { lookup as mimeTypeLookup } from 'mime-types';
import { basename } from 'path';
import { parse as qsParse } from 'qs';
import { SecureContextOptions } from 'tls';
import TypedEmitter from 'typed-emitter';
import { xml2js } from 'xml-js';
import { ParsedXMLBodyMimeTypes } from '../../constants/common.constants';
import { DefaultTLSOptions } from '../../constants/ssl.constants';
import { ResponseRulesInterpreter } from '../response-rules-interpreter';
import { TemplateParser } from '../template-parser';
import { listOfRequestHelperTypes } from '../templating-helpers/request-helpers';
import {
  CreateTransaction,
  resolvePathFromEnvironment,
  stringIncludesArrayItems
} from '../utils';

/**
 * Create a server instance from an Environment object.
 *
 * Extends EventEmitter.
 */
export class MockoonServer extends (EventEmitter as new () => TypedEmitter<ServerEvents>) {
  private serverInstance: httpServer | httpsServer;
  private tlsOptions: SecureContextOptions = {};
  private processedDatabuckets: ProcessedDatabucket[] = [];

  constructor(
    private environment: Environment,
    private options: MockoonServerOptions = {}
  ) {
    super();
  }

  /**
   * Start a server
   */
  public start() {
    const requestListener = this.createRequestListener();

    // create https or http server instance
    if (this.environment.tlsOptions.enabled) {
      try {
        this.tlsOptions = this.buildTLSOptions(this.environment);

        this.serverInstance = httpsCreateServer(
          this.tlsOptions,
          requestListener
        );
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          this.emit('error', ServerErrorCodes.CERT_FILE_NOT_FOUND, error);
        } else {
          this.emit('error', ServerErrorCodes.UNKNOWN_SERVER_ERROR, error);
        }
      }
    } else {
      this.serverInstance = httpCreateServer(requestListener);
    }

    // make serverInstance killable
    this.serverInstance = killable(this.serverInstance);

    // set timeout long enough to allow long latencies
    this.serverInstance.setTimeout(3_600_000);

    // handle server errors
    this.serverInstance.on('error', (error: NodeJS.ErrnoException) => {
      let errorCode: ServerErrorCodes;

      switch (error.code) {
        case 'EADDRINUSE':
          errorCode = ServerErrorCodes.PORT_ALREADY_USED;
          break;
        case 'EACCES':
          errorCode = ServerErrorCodes.PORT_INVALID;
          break;
        case 'EADDRNOTAVAIL':
          errorCode = ServerErrorCodes.HOSTNAME_UNAVAILABLE;
          break;
        case 'ENOTFOUND':
          errorCode = ServerErrorCodes.HOSTNAME_UNKNOWN;
          break;
        default:
          errorCode = ServerErrorCodes.UNKNOWN_SERVER_ERROR;
      }
      this.emit('error', errorCode, error);
    });

    this.serverInstance.listen(
      this.environment.port,
      this.environment.hostname,
      () => {
        this.emit('started');
      }
    );
  }

  /**
   * Kill the server
   */
  public stop() {
    if (this.serverInstance) {
      this.serverInstance.kill(() => {
        this.emit('stopped');
      });
    }
  }

  /**
   * Create a request listener
   */
  public createRequestListener(): RequestListener {
    const app = express();
    app.disable('x-powered-by');
    app.disable('etag');

    this.generateDatabuckets(this.environment);

    app.use(this.emitEvent);
    app.use(this.delayResponse);
    app.use(this.deduplicateSlashes);
    app.use(cookieParser());
    app.use(this.parseBody);
    app.use(this.logRequest);
    app.use(this.setResponseHeaders);

    this.setRoutes(app);
    this.setCors(app);
    this.enableProxy(app);
    app.use(this.errorHandler);

    return app;
  }

  /**
   * ### Middleware ###
   * Emit the SERVER_ENTERING_REQUEST event
   *
   * @param request
   * @param response
   * @param next
   */
  private emitEvent = (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    this.emit('entering-request');
    next();
  };

  /**
   * ### Middleware ###
   * Add global latency to the mock server
   *
   * @param request
   * @param response
   * @param next
   */
  private delayResponse = (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    this.refreshEnvironment();

    setTimeout(next, this.environment.latency);
  };

  /**
   * ### Middleware ###
   * Remove duplicate slashes in entering call paths
   *
   * @param request
   * @param response
   * @param next
   */
  private deduplicateSlashes(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    request.url = request.url.replace(/\/{2,}/g, '/');

    next();
  }

  /**
   * ### Middleware ###
   * Parse entering request body
   *
   * @param request
   * @param response
   * @param next
   */
  private parseBody = (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    // Parse body as a raw string and JSON/form if applicable
    const requestContentType: string | undefined =
      request.header('Content-Type');

    const rawBody: Buffer[] = [];

    request.on('data', (chunk) => {
      rawBody.push(Buffer.from(chunk, 'binary'));
    });

    request.on('end', () => {
      request.rawBody = Buffer.concat(rawBody);
      request.stringBody = request.rawBody.toString('utf8');

      try {
        if (requestContentType) {
          if (requestContentType.includes('application/json')) {
            request.body = JSON.parse(request.stringBody);
            next();
          } else if (
            requestContentType.includes('application/x-www-form-urlencoded')
          ) {
            request.body = qsParse(request.stringBody, {
              depth: 10
            });
            next();
          } else if (requestContentType.includes('multipart/form-data')) {
            const busboyParse = busboy({
              headers: request.headers,
              limits: { fieldNameSize: 1000, files: 0 }
            });

            busboyParse.on('field', (name, value, info) => {
              if (request.body === undefined) {
                request.body = {};
              }

              if (name != null && !info.nameTruncated && !info.valueTruncated) {
                appendField(request.body, name, value);
              }
            });

            busboyParse.on('error', (error: any) => {
              this.emit('error', ServerErrorCodes.REQUEST_BODY_PARSE, error);
              // we want to continue answering the call despite the parsing errors
              next();
            });

            busboyParse.on('finish', () => {
              next();
            });

            busboyParse.end(request.rawBody);
          } else if (
            stringIncludesArrayItems(ParsedXMLBodyMimeTypes, requestContentType)
          ) {
            request.body = xml2js(request.stringBody, {
              compact: true
            });
            next();
          } else {
            next();
          }
        } else {
          next();
        }
      } catch (error: any) {
        this.emit('error', ServerErrorCodes.REQUEST_BODY_PARSE, error);
        next();
      }
    });
  };

  /**
   * ### Middleware ###
   * Emit an event when response emit the 'close' event
   *
   * @param request
   * @param response
   * @param next
   */
  private logRequest = (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    response.on('close', () => {
      this.emit('transaction-complete', CreateTransaction(request, response));
    });

    next();
  };

  /**
   * ### Middleware ###
   * Add environment headers & proxy headers to the response
   *
   * @param request
   * @param response
   * @param next
   */
  private setResponseHeaders = (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    this.setHeaders(this.environment.headers, response, request);

    next();
  };

  /**
   * Generate an environment routes and attach to running server
   *
   * @param server - server on which attach routes
   */
  private setRoutes(server: Application) {
    this.environment.routes.forEach((declaredRoute: Route) => {
      // only launch non duplicated routes, or ignore if none.
      if (declaredRoute.enabled) {
        try {
          let routePath = `/${
            this.environment.endpointPrefix
          }/${declaredRoute.endpoint.replace(/ /g, '%20')}`;

          routePath = routePath.replace(/\/{2,}/g, '/');

          this.createRESTRoute(server, declaredRoute, routePath);
        } catch (error: any) {
          let errorCode = ServerErrorCodes.ROUTE_CREATION_ERROR;

          // if invalid regex defined
          if (error.message.indexOf('Invalid regular expression') > -1) {
            errorCode = ServerErrorCodes.ROUTE_CREATION_ERROR_REGEX;
          }

          this.emit('error', errorCode, error);
        }
      }
    });
  }

  /**
   * Create a regular REST route (GET, POST, etc.)
   *
   * @param server
   * @param route
   * @param routePath
   * @param requestNumber
   */
  private createRESTRoute(
    server: Application,
    route: Route,
    routePath: string
  ) {
    let requestNumber = 1;

    server[route.method](routePath, (request: Request, response: Response) => {
      this.generateRequestDatabuckets(route, this.environment, request);

      // refresh environment data to get route changes that do not require a restart (headers, body, etc)
      this.refreshEnvironment();
      const currentRoute = this.getRefreshedRoute(route);

      if (!currentRoute) {
        this.sendError(
          response,
          CommonsTexts.EN.MESSAGES.ROUTE_NO_LONGER_EXISTS,
          404
        );

        return;
      }

      const enabledRouteResponse = new ResponseRulesInterpreter(
        currentRoute.responses,
        request,
        currentRoute.responseMode
      ).chooseResponse(requestNumber);

      requestNumber += 1;

      // save route and response UUIDs for logs (only in desktop app)
      if (route.uuid && enabledRouteResponse.uuid) {
        response.routeUUID = route.uuid;
        response.routeResponseUUID = enabledRouteResponse.uuid;
      }

      // add route latency if any
      setTimeout(() => {
        const contentType = GetRouteResponseContentType(
          this.environment,
          enabledRouteResponse
        );
        const routeContentType = GetContentType(enabledRouteResponse.headers);

        // set http code
        response.status(enabledRouteResponse.statusCode);

        this.setHeaders(enabledRouteResponse.headers, response, request);

        // send the file
        if (
          enabledRouteResponse.bodyType === BodyTypes.FILE &&
          enabledRouteResponse.filePath
        ) {
          this.sendFile(
            enabledRouteResponse,
            routeContentType,
            request,
            response
          );
          // serve inline body or databucket
        } else {
          let templateParse = true;

          if (contentType.includes('application/json')) {
            response.set('Content-Type', 'application/json');
          }

          // serve inline body as default
          let content = enabledRouteResponse.body;

          if (
            enabledRouteResponse.bodyType === BodyTypes.DATABUCKET &&
            enabledRouteResponse.databucketID
          ) {
            // databuckets are parsed at the server start or beginning of first request execution (no need to parse templating again)
            templateParse = false;

            const servedDatabucket = this.processedDatabuckets.find(
              (processedDatabucket) =>
                processedDatabucket.id === enabledRouteResponse.databucketID
            );

            // if linked databucket is an array or object we need to stringify it for some values (array, object, booleans and numbers (bool and nb because expressjs canno serve this as is))
            if (
              servedDatabucket?.parsed &&
              (Array.isArray(servedDatabucket.value) ||
                typeof servedDatabucket.value === 'object' ||
                typeof servedDatabucket.value === 'boolean' ||
                typeof servedDatabucket.value === 'number')
            ) {
              content = JSON.stringify(servedDatabucket?.value);
            } else {
              content = servedDatabucket?.value;
            }
          }

          this.serveBody(
            content || '',
            enabledRouteResponse,
            request,
            response,
            templateParse
          );
        }
      }, enabledRouteResponse.latency);
    });
  }

  /**
   * Parse the body templating and send it as the response body
   *
   * @param routeResponse
   * @param request
   * @param response
   */
  private serveBody(
    content: string,
    routeResponse: RouteResponse,
    request: Request,
    response: Response,
    templateParse = true
  ) {
    try {
      if (!routeResponse.disableTemplating && templateParse) {
        content = TemplateParser(
          false,
          content || '',
          this.environment,
          this.processedDatabuckets,
          request
        );
      }

      response.body = content;

      response.send(content);
    } catch (error: any) {
      this.emit('error', ServerErrorCodes.ROUTE_SERVING_ERROR, error);

      this.sendError(
        response,
        `${CommonsTexts.EN.MESSAGES.ROUTE_SERVING_ERROR}: ${error.message}`
      );
    }
  }

  /**
   * Send a file as response body.
   * Revert to sendBody if file is not found.
   *
   * @param routeResponse
   * @param routeContentType
   * @param request
   * @param response
   */
  private sendFile(
    routeResponse: RouteResponse,
    routeContentType: string | null,
    request: Request,
    response: Response
  ) {
    const fileServingError = (error) => {
      this.emit('error', ServerErrorCodes.ROUTE_FILE_SERVING_ERROR, error);
      this.sendError(
        response,
        `${CommonsTexts.EN.MESSAGES.ROUTE_FILE_SERVING_ERROR}: ${error.message}`
      );
    };

    const errorThrowOrFallback = (error) => {
      if (routeResponse.fallbackTo404) {
        response.status(404);
        const content = routeResponse.body ? routeResponse.body : '';
        this.serveBody(content, routeResponse, request, response);
      } else {
        fileServingError(error);
      }
    };

    try {
      let filePath = TemplateParser(
        false,
        routeResponse.filePath.replace(/\\/g, '/'),
        this.environment,
        this.processedDatabuckets,
        request
      );

      filePath = resolvePathFromEnvironment(
        filePath,
        this.options.environmentDirectory
      );

      const fileMimeType = mimeTypeLookup(filePath) || '';

      // set content-type the detected mime type if any
      if (!routeContentType && fileMimeType) {
        response.set('Content-Type', fileMimeType);
      }

      if (!routeResponse.sendFileAsBody) {
        response.set(
          'Content-Disposition',
          `attachment; filename="${basename(filePath)}"`
        );
      }

      // parse templating for a limited list of mime types
      if (
        MimeTypesWithTemplating.indexOf(fileMimeType) > -1 &&
        !routeResponse.disableTemplating
      ) {
        readFile(filePath, (readError, data) => {
          if (readError) {
            errorThrowOrFallback(readError);

            return;
          }

          try {
            const fileContent = TemplateParser(
              false,
              data.toString(),
              this.environment,
              this.processedDatabuckets,
              request
            );

            response.body = fileContent;
            response.send(fileContent);
          } catch (error: any) {
            fileServingError(error);
          }
        });
      } else {
        try {
          response.body = BINARY_BODY;
          const { size } = statSync(filePath);
          this.setHeaders(
            [
              {
                key: 'Content-Length',
                value: size.toString()
              }
            ],
            response,
            request
          );
          // use read stream for better performance
          createReadStream(filePath).pipe(response);
        } catch (error: any) {
          errorThrowOrFallback(error);
        }
      }
    } catch (error: any) {
      this.emit('error', ServerErrorCodes.ROUTE_SERVING_ERROR, error);

      this.sendError(
        response,
        `${CommonsTexts.EN.MESSAGES.ROUTE_SERVING_ERROR}: ${error.message}`
      );
    }
  }

  /**
   * Always answer with status 200 to CORS pre flight OPTIONS requests if option activated.
   * /!\ Must be called after the routes creation otherwise it will intercept all user defined OPTIONS routes.
   *
   * @param server - express instance
   */
  private setCors(server: Application) {
    if (this.environment.cors) {
      server.options('/*', (req, res) => {
        this.refreshEnvironment();

        // override default CORS headers with environment's headers
        this.setHeaders(
          [...CORSHeaders, ...this.environment.headers],
          res,
          req
        );

        res.status(200).end();
      });
    }
  }

  /**
   * Add catch-all proxy if enabled.
   * Restream the body to the proxied API because it already has been
   * intercepted by the body parser.
   *
   * @param server - server on which to launch the proxy
   */
  private enableProxy(server: Application) {
    if (
      this.environment.proxyMode &&
      this.environment.proxyHost &&
      IsValidURL(this.environment.proxyHost)
    ) {
      this.emit('creating-proxy');

      server.use(
        '*',
        createProxyMiddleware({
          cookieDomainRewrite: { '*': '' },
          target: this.environment.proxyHost,
          secure: false,
          changeOrigin: true,
          logProvider: this.options.logProvider,
          pathRewrite: (path, req) => {
            if (
              this.environment.proxyRemovePrefix === true &&
              this.environment.endpointPrefix.length > 0
            ) {
              const regExp = new RegExp(`^/${this.environment.endpointPrefix}`);

              return path.replace(regExp, '');
            }

            return path;
          },
          ssl: { ...this.tlsOptions, agent: false },
          onProxyReq: (proxyReq, request, response) => {
            this.refreshEnvironment();

            request.proxied = true;

            this.setHeaders(
              this.environment.proxyReqHeaders,
              proxyReq,
              request as Request
            );

            // re-stream the body (intercepted by body parser method)
            if (request.rawBody) {
              proxyReq.write(request.rawBody);
            }
          },
          onProxyRes: (proxyRes, request, response) => {
            this.refreshEnvironment();

            const buffers: Buffer[] = [];
            proxyRes.on('data', (chunk) => {
              buffers.push(chunk);
            });
            proxyRes.on('end', () => {
              response.body = Buffer.concat(buffers);
            });

            this.setHeaders(
              this.environment.proxyResHeaders,
              proxyRes,
              request as Request
            );
          },
          onError: (error, request, response) => {
            this.emit('error', ServerErrorCodes.PROXY_ERROR, error);
            this.sendError(
              response as Response,
              `${CommonsTexts.EN.MESSAGES.PROXY_ERROR}${this.environment.proxyHost}${request.url}: ${error}`,
              504
            );
          }
        })
      );
    }
  }

  /**
   * ### Middleware ###
   * Catch all error handler
   * http://expressjs.com/en/guide/error-handling.html#catching-errors
   *
   * @param server - server on which to log the response
   */
  private errorHandler = (
    error: any,
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    this.sendError(response, error, 500);
  };

  /**
   * Set the provided headers on the target. Use different headers accessors
   * depending on the type of target:
   * express.Response/http.OutgoingMessage/http.IncomingMessage
   * Use the source in the template parsing of each header value.
   *
   * @param headers
   * @param target
   * @param request
   */
  private setHeaders(headers: Header[], target: any, request: Request) {
    headers.forEach((header: Header) => {
      try {
        const isSetCookie = header.key.toLowerCase() === 'set-cookie';
        let parsedHeaderValue = this.parseHeader(header, request);

        if (parsedHeaderValue === null) {
          return;
        }

        if (target.set) {
          // for express.Response
          if (isSetCookie) {
            target.append(header.key, parsedHeaderValue);
          } else {
            target.set(header.key, parsedHeaderValue);
          }
        } else if (target.setHeader) {
          // for proxy http.OutgoingMessage | ClientRequest
          target.setHeader(header.key, parsedHeaderValue);
        } else {
          // for http.IncomingMessage
          if (isSetCookie) {
            // Remove the secure flag
            parsedHeaderValue = parsedHeaderValue.replace(/; secure/gi, '');
            target.headers[header.key] = this.appendHeaderValue(
              target.headers[header.key],
              parsedHeaderValue
            );
          } else {
            target.headers[header.key] = parsedHeaderValue;
          }
        }
      } catch (error) {}
    });
  }

  /**
   * If header already has a value, concatenate the values into an array
   *
   * @param currentValue
   * @param newValue
   * @returns
   */
  private appendHeaderValue(
    currentValue: string | string[],
    newValue: string
  ): string | string[] {
    let headerValue: string | string[] = newValue;

    if (currentValue) {
      headerValue = Array.isArray(currentValue)
        ? currentValue.concat(headerValue)
        : [currentValue, headerValue];
    }

    return headerValue;
  }

  /**
   * Verify a header validity and parse its content, if templating is used
   *
   * @param header
   * @param request
   * @returns
   */
  private parseHeader(header: Header, request: Request): string | null {
    let parsedHeaderValue: string | null = null;

    if (header.key && header.value) {
      try {
        parsedHeaderValue = TemplateParser(
          false,
          header.value,
          this.environment,
          this.processedDatabuckets,
          request
        );
      } catch (error) {
        const errorMessage = CommonsTexts.EN.MESSAGES.HEADER_PARSING_ERROR;
        parsedHeaderValue = errorMessage;
      }
    }

    return parsedHeaderValue;
  }

  /**
   * Send an error with text/plain content type, the provided message and status code.
   * Status is optional. No status will default to the one defined by the user, allowing for maximum customization.
   *
   * @param response
   * @param errorMessage
   * @param status
   */
  private sendError(response: Response, errorMessage: string, status?: number) {
    response.set('Content-Type', 'text/plain');
    response.body = errorMessage;

    if (status !== undefined) {
      response.status(status);
    }

    response.send(errorMessage);
  }

  /**
   * Request an updated environment to allow
   * modification of some parameters without a restart (latency, headers, etc)
   */
  private refreshEnvironment() {
    if (this.options.refreshEnvironmentFunction && this.environment.uuid) {
      const updatedEnvironment = this.options.refreshEnvironmentFunction(
        this.environment.uuid
      );

      if (updatedEnvironment) {
        this.environment = updatedEnvironment;
      }
    }
  }

  /**
   * Request an updated route to allow
   * modification of some parameters without a restart (latency, headers, etc)
   * This only makes sense if the refreshEnvironmentFunction has been provided.
   *
   * @param routeUUID
   */
  private getRefreshedRoute(currentRoute: Route): Route | undefined {
    if (this.options.refreshEnvironmentFunction && this.environment.uuid) {
      return this.environment.routes.find(
        (route) => route.uuid === currentRoute.uuid
      );
    }

    return currentRoute;
  }

  /**
   * Build the secure context options
   * - if custom cert are provided load them
   * - if not, use default TLS cert (self-signed)
   *
   * @returns
   */
  private buildTLSOptions(environment: Environment): SecureContextOptions {
    let tlsOptions: SecureContextOptions = {};

    if (
      environment.tlsOptions?.pfxPath ||
      (environment.tlsOptions?.certPath && environment.tlsOptions?.keyPath)
    ) {
      if (
        environment.tlsOptions?.type === 'PFX' &&
        environment.tlsOptions?.pfxPath
      ) {
        tlsOptions.pfx = readFileSync(
          resolvePathFromEnvironment(
            environment.tlsOptions?.pfxPath,
            this.options.environmentDirectory
          )
        );
      } else if (
        environment.tlsOptions?.type === 'CERT' &&
        environment.tlsOptions?.certPath &&
        environment.tlsOptions?.keyPath
      ) {
        tlsOptions.cert = readFileSync(
          resolvePathFromEnvironment(
            environment.tlsOptions?.certPath,
            this.options.environmentDirectory
          )
        );
        tlsOptions.key = readFileSync(
          resolvePathFromEnvironment(
            environment.tlsOptions?.keyPath,
            this.options.environmentDirectory
          )
        );
      }

      if (environment.tlsOptions?.caPath) {
        tlsOptions.ca = readFileSync(
          resolvePathFromEnvironment(
            environment.tlsOptions?.caPath,
            this.options.environmentDirectory
          )
        );
      }

      if (environment.tlsOptions?.passphrase) {
        tlsOptions.passphrase = environment.tlsOptions?.passphrase;
      }
    } else {
      tlsOptions = { ...DefaultTLSOptions };
    }

    return tlsOptions;
  }

  /**
   * Parse all databuckets in the environment and set their parsed value to true except if they contain request helpers
   * @param environment
   */
  private generateDatabuckets(environment: Environment) {
    if (environment.data.length > 0) {
      environment.data.forEach((databucket) => {
        let newProcessedDatabucket: ProcessedDatabucket;

        if (
          databucket.value.match(
            new RegExp(
              `{{2,3}[\s|#|\\w|(]*(${listOfRequestHelperTypes.join('|')})`
            )
          )
        ) {
          // a request helper was found
          newProcessedDatabucket = {
            id: databucket.id,
            name: databucket.name,
            value: databucket.value,
            parsed: false
          };
        } else {
          const templateParsedContent = TemplateParser(
            false,
            databucket.value,
            environment,
            this.processedDatabuckets
          );

          try {
            const JSONParsedContent = JSON.parse(templateParsedContent);
            newProcessedDatabucket = {
              id: databucket.id,
              name: databucket.name,
              value: JSONParsedContent,
              parsed: true
            };
          } catch (e) {
            newProcessedDatabucket = {
              id: databucket.id,
              name: databucket.name,
              value: templateParsedContent,
              parsed: true
            };
          }
        }
        this.processedDatabuckets.push(newProcessedDatabucket);
      });
    }
  }

  /**
   * Generate the databuckets called with the data helper on route call
   * @param route
   * @param environment
   * @param request
   */
  private generateRequestDatabuckets(
    route: Route,
    environment: Environment,
    request: Request
  ) {
    // do not continue if all the buckets were previously parsed
    if (
      !this.processedDatabuckets.some(
        (processedDatabucket) => !processedDatabucket.parsed
      )
    ) {
      return;
    }

    route.responses.forEach((response) => {
      const results = response.body?.matchAll(
        new RegExp('{{2,3}[\\s|#|\\w|(]*data [\'|"]{1}([^(\'|")]*)', 'g')
      );
      const databucketIdsToParse = [...(results || [])].map(
        (match) => match[1]
      );
      if (response.databucketID) {
        databucketIdsToParse.push(response.databucketID);
      }

      if (databucketIdsToParse.length) {
        let targetDatabucket: ProcessedDatabucket | undefined;

        for (const databucketIdToParse of databucketIdsToParse) {
          targetDatabucket = this.processedDatabuckets.find(
            (databucket) =>
              databucket.id === databucketIdToParse ||
              databucket.name
                .toLowerCase()
                .includes(databucketIdToParse.toLowerCase())
          );

          if (targetDatabucket && !targetDatabucket?.parsed) {
            let content = targetDatabucket.value;
            content = TemplateParser(
              false,
              targetDatabucket.value,
              environment,
              this.processedDatabuckets,
              request
            );
            try {
              const JSONParsedcontent = JSON.parse(content);
              targetDatabucket.value = JSONParsedcontent;
              targetDatabucket.parsed = true;
            } catch {
              targetDatabucket.value = content;
              targetDatabucket.parsed = true;
            }
          }
        }
      }
    });
  }
}
