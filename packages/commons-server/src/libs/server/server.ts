import {
  BINARY_BODY,
  BodyTypes,
  Callback,
  CallbackInvocation,
  CORSHeaders,
  defaultEnvironmentVariablesPrefix,
  Environment,
  FakerAvailableLocales,
  FileExtensionsWithTemplating,
  GetContentType,
  GetRouteResponseContentType,
  Header,
  IsValidURL,
  MimeTypesWithTemplating,
  ProcessedDatabucket,
  Route,
  RouteResponse,
  RouteType,
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
import { basename, extname } from 'path';
import { parse as qsParse } from 'qs';
import rangeParser from 'range-parser';
import { SecureContextOptions } from 'tls';
import TypedEmitter from 'typed-emitter';
import { format } from 'util';
import { xml2js } from 'xml-js';
import {
  ParsedJSONBodyMimeTypes,
  ParsedXMLBodyMimeTypes
} from '../../constants/common.constants';
import { ServerMessages } from '../../constants/server-messages.constants';
import { DefaultTLSOptions } from '../../constants/ssl.constants';
import { SetFakerLocale, SetFakerSeed } from '../faker';
import { ResponseRulesInterpreter } from '../response-rules-interpreter';
import { TemplateParser } from '../template-parser';
import { requestHelperNames } from '../templating-helpers/request-helpers';
import {
  CreateCallbackInvocation,
  CreateTransaction,
  dedupSlashes,
  isBodySupportingMethod,
  preparePath,
  resolvePathFromEnvironment,
  routesFromFolder,
  stringIncludesArrayItems
} from '../utils';
import { CrudRouteIds, crudRoutesBuilder, databucketActions } from './crud';

/**
 * Create a server instance from an Environment object.
 *
 * Extends EventEmitter.
 */
export class MockoonServer extends (EventEmitter as new () => TypedEmitter<ServerEvents>) {
  private serverInstance: httpServer | httpsServer;
  private tlsOptions: SecureContextOptions = {};
  private processedDatabuckets: ProcessedDatabucket[] = [];
  // templating global variables
  private globalVariables: Record<string, any> = {};

  constructor(
    private environment: Environment,
    private options: {
      /**
       * Directory where to find the environment file.
       */
      environmentDirectory?: string;

      /**
       * List of routes uuids to disable.
       * Can also accept strings containing a route partial path, e.g. 'users' will disable all routes containing 'users' in their path.
       */
      disabledRoutes?: string[];

      /**
       * Method used by the library to refresh the environment information
       */
      refreshEnvironmentFunction?: (
        environmentUUID: string
      ) => Environment | null;

      /**
       * Faker options: seed and locale
       */
      fakerOptions?: {
        // Faker locale (e.g. 'en', 'en_GB', etc. For supported locales, see documentation.)
        locale?: FakerAvailableLocales;
        // Number for the Faker.js seed (e.g. 1234)
        seed?: number;
      };

      /**
       * Environment variables prefix
       */
      envVarsPrefix: string;
    } = { envVarsPrefix: defaultEnvironmentVariablesPrefix }
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

    try {
      this.serverInstance.listen(
        { port: this.environment.port, host: this.environment.hostname },
        () => {
          this.emit('started');
        }
      );
    } catch (error: any) {
      if (error.code === 'ERR_SOCKET_BAD_PORT') {
        this.emit('error', ServerErrorCodes.PORT_INVALID, error);
      }
    }
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
    /**
     * Apply faker.js settings at each server start.
     * Locale must be set before seed.
     * We do this in the request listener to allow changing the locale and seed from the serverless package too, which is not using the start/stop methods.
     */
    SetFakerLocale(this.options.fakerOptions?.locale ?? 'en');
    SetFakerSeed(this.options.fakerOptions?.seed ?? undefined);

    const app = express();
    app.disable('x-powered-by');
    app.disable('etag');

    this.generateDatabuckets(this.environment);

    app.use(this.emitEvent);
    app.use(this.delayResponse);
    app.use(this.deduplicateRequestSlashes);
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
  private deduplicateRequestSlashes(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    request.url = dedupSlashes(request.url);

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
          if (
            stringIncludesArrayItems(
              ParsedJSONBodyMimeTypes,
              requestContentType
            )
          ) {
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
    if (
      !this.environment.rootChildren ||
      this.environment.rootChildren.length < 1
    ) {
      return;
    }

    const routes = routesFromFolder(
      this.environment.rootChildren,
      this.environment.folders,
      this.environment.routes
    );

    routes.forEach((declaredRoute: Route) => {
      const routePath = preparePath(
        this.environment.endpointPrefix,
        declaredRoute.endpoint
      );

      if (
        !this.options.disabledRoutes?.some(
          (disabledRoute) =>
            declaredRoute.uuid === disabledRoute ||
            routePath.includes(disabledRoute)
        )
      ) {
        try {
          if (declaredRoute.type === RouteType.CRUD) {
            this.createCRUDRoute(server, declaredRoute, routePath);
          } else {
            this.createRESTRoute(server, declaredRoute, routePath);
          }
        } catch (error: any) {
          let errorCode = ServerErrorCodes.ROUTE_CREATION_ERROR;

          // if invalid regex defined
          if (error.message.indexOf('Invalid regular expression') > -1) {
            errorCode = ServerErrorCodes.ROUTE_CREATION_ERROR_REGEX;
          }

          this.emit('error', errorCode, error, {
            routePath: declaredRoute.endpoint,
            routeUUID: declaredRoute.uuid
          });
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
   */
  private createRESTRoute(
    server: Application,
    route: Route,
    routePath: string
  ) {
    server[route.method](routePath, this.createRouteHandler(route, 1));
  }

  /**
   * Create a CRUD route: GET, POST, PUT, PATCH, DELETE
   *
   * @param server
   * @param route
   * @param routePath
   */
  private createCRUDRoute(
    server: Application,
    route: Route,
    routePath: string
  ) {
    const crudRoutes = crudRoutesBuilder(routePath);

    for (const crudRoute of crudRoutes) {
      server[crudRoute.method](
        crudRoute.path,
        this.createRouteHandler(route, 1, crudRoute.id)
      );
    }
  }

  private createRouteHandler(
    route: Route,
    requestNumber: number,
    crudId?: CrudRouteIds
  ) {
    return (request: Request, response: Response, next: NextFunction) => {
      this.generateRequestDatabuckets(route, this.environment, request);

      // refresh environment data to get route changes that do not require a restart (headers, body, etc)
      this.refreshEnvironment();
      const currentRoute = this.getRefreshedRoute(route);

      if (!currentRoute) {
        this.emit('error', ServerErrorCodes.ROUTE_NO_LONGER_EXISTS, null, {
          routePath: route.endpoint,
          routeUUID: route.uuid
        });

        this.sendError(response, ServerMessages.ROUTE_NO_LONGER_EXISTS, 404);

        return;
      }

      const enabledRouteResponse = new ResponseRulesInterpreter(
        currentRoute.responses,
        request,
        currentRoute.responseMode,
        this.environment,
        this.processedDatabuckets,
        this.globalVariables,
        this.options.envVarsPrefix
      ).chooseResponse(requestNumber);

      if (!enabledRouteResponse) {
        return next();
      }

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
            route,
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
          let content: any = enabledRouteResponse.body;

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

            if (servedDatabucket) {
              content = servedDatabucket.value;

              if (route.type === RouteType.CRUD && crudId) {
                content = databucketActions(
                  crudId,
                  servedDatabucket,
                  request,
                  response,
                  currentRoute.responses[0].crudKey
                );
              }

              // if returned content is an array or object we need to stringify it for some values (array, object, booleans and numbers (bool and nb because expressjs cannot serve this as is))
              if (
                Array.isArray(content) ||
                typeof content === 'object' ||
                typeof content === 'boolean' ||
                typeof content === 'number'
              ) {
                content = JSON.stringify(content);
              } else {
                content = content;
              }
            }
          }

          this.serveBody(
            content || '',
            route,
            enabledRouteResponse,
            request,
            response,
            templateParse
          );
        }
      }, enabledRouteResponse.latency);
    };
  }

  private makeCallbacks(
    routeResponse: RouteResponse,
    request: Request,
    response: Response
  ) {
    if (routeResponse.callbacks && routeResponse.callbacks.length > 0) {
      for (const invocation of routeResponse.callbacks) {
        const cb = this.environment.callbacks.find(
          (ref) => ref.uuid === invocation.uuid
        );

        if (!cb) {
          continue;
        }

        try {
          const url = TemplateParser({
            shouldOmitDataHelper: false,
            content: cb.uri,
            environment: this.environment,
            processedDatabuckets: this.processedDatabuckets,
            globalVariables: this.globalVariables,
            request,
            response,
            envVarsPrefix: this.options.envVarsPrefix
          });

          let content = cb.body;
          let templateParse = true;

          if (cb.bodyType === BodyTypes.DATABUCKET && cb.databucketID) {
            templateParse = false;

            const servedDatabucket = this.processedDatabuckets.find(
              (processedDatabucket) =>
                processedDatabucket.id === cb.databucketID
            );

            if (servedDatabucket) {
              content = servedDatabucket.value;

              // if returned content is an array or object we need to stringify it for some values (array, object, booleans and numbers (bool and nb because expressjs cannot serve this as is))
              if (
                Array.isArray(content) ||
                typeof content === 'object' ||
                typeof content === 'boolean' ||
                typeof content === 'number'
              ) {
                content = JSON.stringify(content);
              } else {
                content = content;
              }
            }
          } else if (cb.bodyType === BodyTypes.FILE && cb.filePath) {
            this.sendFileWithCallback(
              routeResponse,
              cb,
              invocation,
              request,
              response
            );

            continue;
          }

          const sendingHeaders = {
            headers: {}
          };
          this.setHeaders(cb.headers || [], sendingHeaders, request);

          // apply templating if specified
          if (!routeResponse.disableTemplating && templateParse) {
            content = TemplateParser({
              shouldOmitDataHelper: false,
              content: content || '',
              environment: this.environment,
              processedDatabuckets: this.processedDatabuckets,
              globalVariables: this.globalVariables,
              request,
              response,
              envVarsPrefix: this.options.envVarsPrefix
            });
          }

          setTimeout(() => {
            fetch(url, {
              method: cb.method,
              headers: sendingHeaders.headers,
              body: isBodySupportingMethod(cb.method) ? content : undefined
            })
              .then((res) => {
                this.emitCallbackInvoked(
                  res,
                  cb,
                  url,
                  content,
                  sendingHeaders.headers
                );
              })
              .catch((e) =>
                this.emit('error', ServerErrorCodes.CALLBACK_ERROR, e, {
                  callbackName: cb.name
                })
              );
          }, invocation.latency);
        } catch (error: any) {
          this.emit('error', ServerErrorCodes.CALLBACK_ERROR, error, {
            callbackName: cb.name
          });
        }
      }
    }
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
    route: Route,
    routeResponse: RouteResponse,
    request: Request,
    response: Response,
    templateParse = true
  ) {
    try {
      if (!routeResponse.disableTemplating && templateParse) {
        content = TemplateParser({
          shouldOmitDataHelper: false,
          content: content || '',
          environment: this.environment,
          processedDatabuckets: this.processedDatabuckets,
          globalVariables: this.globalVariables,
          request,
          response,
          envVarsPrefix: this.options.envVarsPrefix
        });
      }

      this.applyResponseLocals(response);

      response.body = content;

      // execute callbacks after generating the template, to be able to use the eventual templating variables in the callback
      this.makeCallbacks(routeResponse, request, response);

      response.send(content);
    } catch (error: any) {
      this.emit('error', ServerErrorCodes.ROUTE_SERVING_ERROR, error, {
        routePath: route.endpoint,
        routeUUID: route.uuid
      });

      this.sendError(
        response,
        format(ServerMessages.ROUTE_SERVING_ERROR, error.message)
      );
    }
  }

  private sendFileWithCallback(
    routeResponse: RouteResponse,
    callback: Callback,
    invocation: CallbackInvocation,
    request: Request,
    response: Response
  ) {
    if (!callback.filePath) {
      return;
    }

    const fileServingError = (error) => {
      this.emit('error', ServerErrorCodes.CALLBACK_FILE_ERROR, error, {
        callbackName: callback.name
      });
    };

    try {
      const url = TemplateParser({
        shouldOmitDataHelper: false,
        content: callback.uri,
        environment: this.environment,
        processedDatabuckets: this.processedDatabuckets,
        globalVariables: this.globalVariables,
        request,
        response,
        envVarsPrefix: this.options.envVarsPrefix
      });

      let filePath = TemplateParser({
        shouldOmitDataHelper: false,
        content: callback.filePath.replace(/\\/g, '/'),
        environment: this.environment,
        processedDatabuckets: this.processedDatabuckets,
        globalVariables: this.globalVariables,
        request,
        envVarsPrefix: this.options.envVarsPrefix
      });

      filePath = resolvePathFromEnvironment(
        filePath,
        this.options.environmentDirectory
      );

      const fileMimeType = mimeTypeLookup(filePath) || '';

      const sendingHeaders = {
        headers: {}
      };
      this.setHeaders(callback.headers || [], sendingHeaders, request);

      const definedContentType = sendingHeaders.headers['Content-Type'];

      // parse templating for a limited list of mime types

      try {
        if (!callback.sendFileAsBody) {
          const buffer = readFileSync(filePath);
          const form = new FormData();
          form.append('file', new Blob([buffer]));

          setTimeout(() => {
            fetch(url, {
              method: callback.method,
              body: form,
              headers: sendingHeaders.headers
            })
              .then((res) => {
                this.emitCallbackInvoked(
                  res,
                  callback,
                  url,
                  `<buffer of ${filePath}`,
                  sendingHeaders.headers
                );
              })
              .catch((e) =>
                this.emit('error', ServerErrorCodes.CALLBACK_ERROR, e, {
                  callbackName: callback.name
                })
              );
          }, invocation.latency);
        } else {
          const data = readFileSync(filePath);
          let fileContent;
          if (
            MimeTypesWithTemplating.indexOf(fileMimeType) > -1 &&
            !routeResponse.disableTemplating
          ) {
            fileContent = TemplateParser({
              shouldOmitDataHelper: false,
              content: data.toString(),
              environment: this.environment,
              processedDatabuckets: this.processedDatabuckets,
              globalVariables: this.globalVariables,
              request,
              response,
              envVarsPrefix: this.options.envVarsPrefix
            });
          } else {
            fileContent = data.toString();
          }

          // set content-type the detected mime type if any
          if (!definedContentType && fileMimeType) {
            sendingHeaders.headers['Content-Type'] = fileMimeType;
          }

          setTimeout(() => {
            fetch(url, {
              method: callback.method,
              headers: sendingHeaders.headers,
              body: fileContent
            })
              .then((res) => {
                this.emitCallbackInvoked(
                  res,
                  callback,
                  url,
                  fileContent,
                  sendingHeaders.headers
                );
              })
              .catch((e) =>
                this.emit('error', ServerErrorCodes.CALLBACK_ERROR, e, {
                  callbackName: callback.name
                })
              );
          }, invocation.latency);
        }
      } catch (error: any) {
        fileServingError(error);
      }
    } catch (error: any) {
      fileServingError(error);
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
    route: Route,
    routeResponse: RouteResponse,
    routeContentType: string | null,
    request: Request,
    response: Response
  ) {
    const fileServingError = (error) => {
      this.emit('error', ServerErrorCodes.ROUTE_FILE_SERVING_ERROR, error, {
        routePath: route.endpoint,
        routeUUID: route.uuid
      });
      this.sendError(
        response,
        format(ServerMessages.ROUTE_FILE_SERVING_ERROR, error.message)
      );
    };

    const errorThrowOrFallback = (error) => {
      if (routeResponse.fallbackTo404) {
        response.status(404);
        const content = routeResponse.body ? routeResponse.body : '';
        this.serveBody(content, route, routeResponse, request, response);
      } else {
        fileServingError(error);
      }
    };

    try {
      let filePath = TemplateParser({
        shouldOmitDataHelper: false,
        content: routeResponse.filePath.replace(/\\/g, '/'),
        environment: this.environment,
        processedDatabuckets: this.processedDatabuckets,
        globalVariables: this.globalVariables,
        request,
        envVarsPrefix: this.options.envVarsPrefix
      });

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
        (MimeTypesWithTemplating.indexOf(fileMimeType) > -1 ||
          FileExtensionsWithTemplating.indexOf(extname(filePath)) > -1) &&
        !routeResponse.disableTemplating
      ) {
        readFile(filePath, (readError, data) => {
          if (readError) {
            errorThrowOrFallback(readError);

            return;
          }

          try {
            const fileContent = TemplateParser({
              shouldOmitDataHelper: false,
              content: data.toString(),
              environment: this.environment,
              processedDatabuckets: this.processedDatabuckets,
              globalVariables: this.globalVariables,
              request,
              response,
              envVarsPrefix: this.options.envVarsPrefix
            });

            this.applyResponseLocals(response);

            response.body = fileContent;

            // execute callbacks after generating the file content, to be able to use the eventual templating variables in the callback
            this.makeCallbacks(routeResponse, request, response);

            response.send(fileContent);
          } catch (error: any) {
            fileServingError(error);
          }
        });
      } else {
        try {
          const rangeHeader = request.headers.range;
          const { size } = statSync(filePath);
          response.body = BINARY_BODY;
          let stream = createReadStream(filePath);

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

          if (rangeHeader) {
            const parsedRange = rangeParser(size, rangeHeader);

            // unsatisfiable range
            if (parsedRange === -1) {
              this.sendError(response, 'Requested range not satisfiable', 416);

              return;
            } else if (parsedRange === -2) {
              // malformed header
              this.sendError(response, 'Malformed range header', 400);

              return;
            } else if (parsedRange) {
              const start = parsedRange[0].start;
              const end = parsedRange[0].end;
              const chunksize = end - start + 1;
              stream = createReadStream(filePath, { start, end });

              this.setHeaders(
                [
                  {
                    key: 'Content-Range',
                    value: `bytes ${start}-${end}/${size}`
                  },
                  {
                    key: 'Accept-Ranges',
                    value: 'bytes'
                  },
                  {
                    key: 'Content-Length',
                    value: chunksize.toString()
                  },
                  {
                    key: 'Content-Type',
                    value: fileMimeType
                  }
                ],
                response,
                request
              );

              response.status(206);
              stream = createReadStream(filePath, { start, end });
            }
          }

          this.makeCallbacks(routeResponse, request, response);

          stream.pipe(response);
        } catch (error: any) {
          errorThrowOrFallback(error);
        }
      }
    } catch (error: any) {
      this.emit('error', ServerErrorCodes.ROUTE_SERVING_ERROR, error, {
        routePath: route.endpoint,
        routeUUID: route.uuid
      });

      this.sendError(
        response,
        format(ServerMessages.ROUTE_SERVING_ERROR, error.message)
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
          logLevel: 'silent',
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
              `${format(
                ServerMessages.PROXY_ERROR,
                this.environment.proxyHost
              )} ${request.url}: ${error}`,
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
        parsedHeaderValue = TemplateParser({
          shouldOmitDataHelper: false,
          content: header.value,
          environment: this.environment,
          processedDatabuckets: this.processedDatabuckets,
          globalVariables: this.globalVariables,
          request,
          envVarsPrefix: this.options.envVarsPrefix
        });
      } catch (error: any) {
        this.emit('error', ServerErrorCodes.HEADER_PARSING_ERROR, error, {
          headerKey: header.key,
          headerValue: header.value
        });

        parsedHeaderValue = ServerMessages.HEADER_PARSING_ERROR_LIGHT;
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
  private sendError(
    response: Response,
    errorMessage: string | Error,
    status?: number
  ) {
    response.set('Content-Type', 'text/plain');
    response.body = errorMessage;

    if (errorMessage instanceof Error) {
      errorMessage = errorMessage.message;
    }

    if (status !== undefined) {
      response.status(status);
    }

    response.send(errorMessage);
  }

  /**
   * Emit callback invoked event.
   *
   * @param res
   * @param callback
   * @param url
   * @param requestBody
   * @param requestHeaders
   */
  private emitCallbackInvoked(
    res: globalThis.Response,
    callback: Callback,
    url: string,
    requestBody: string | null | undefined,
    requestHeaders: { [key: string]: any }
  ) {
    res.text().then((respText) => {
      const reqHeaders = Object.keys(requestHeaders).map(
        (k) => ({ key: k, value: requestHeaders[k] }) as Header
      );
      this.emit(
        'callback-invoked',
        CreateCallbackInvocation(
          callback,
          url,
          requestBody,
          reqHeaders,
          res,
          respText
        )
      );
    });
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
            new RegExp(`{{2,3}[#(\\s\\w]*(${requestHelperNames.join('|')})`)
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
          let templateParsedContent;

          try {
            templateParsedContent = TemplateParser({
              shouldOmitDataHelper: false,
              content: databucket.value,
              environment,
              processedDatabuckets: this.processedDatabuckets,
              globalVariables: this.globalVariables,
              envVarsPrefix: this.options.envVarsPrefix
            });

            const JSONParsedContent = JSON.parse(templateParsedContent);
            newProcessedDatabucket = {
              id: databucket.id,
              name: databucket.name,
              value: JSONParsedContent,
              parsed: true
            };
          } catch (error: any) {
            if (error instanceof SyntaxError) {
              newProcessedDatabucket = {
                id: databucket.id,
                name: databucket.name,
                value: templateParsedContent,
                parsed: true
              };
            } else {
              newProcessedDatabucket = {
                id: databucket.id,
                name: databucket.name,
                value: error.message,
                parsed: true
              };
            }
          }
        }
        this.processedDatabuckets.push(newProcessedDatabucket);
      });
    }
  }

  /**
   * Returns list of matched databucket ids in the given text.
   *
   * @param data text to be searched for possible databucket ids
   */
  private captureReferencedDatabucketIds(text?: string): string[] {
    const matches = text?.matchAll(
      new RegExp('data(?:Raw)? +[\'|"]{1}([^(\'|")]*)', 'g')
    );

    return [...(matches || [])].map((match) => match[1]);
  }

  /**
   * Find and returns all unique databucket ids specified in callbacks
   * of the given response.
   * To achieve null safety, this will always return an empty set if no callbacks
   * have been defined.
   *
   * @param response
   * @param environment
   */
  private findDatabucketIdsInCallbacks(
    response: RouteResponse,
    environment: Environment
  ): string[] {
    if (response.callbacks && response.callbacks.length > 0) {
      for (const invocation of response.callbacks) {
        const callback = environment.callbacks.find(
          (ref) => ref.uuid === invocation.uuid
        );

        if (!callback) {
          continue;
        }

        const dataBucketIds = this.captureReferencedDatabucketIds(
          callback.body
        );

        if (callback.databucketID) {
          dataBucketIds.push(callback.databucketID);
        }
      }
    }

    return [];
  }

  /**
   * Generate the databuckets that were not parsed at the server start
   *
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

    let databucketIdsToParse = new Set<string>();

    route.responses.forEach((response) => {
      // capture databucket ids in body and relevant callback definitions
      [
        ...this.captureReferencedDatabucketIds(response.body),
        ...this.findDatabucketIdsInCallbacks(response, environment)
      ].forEach((dataBucketName) => databucketIdsToParse.add(dataBucketName));

      if (response.databucketID) {
        databucketIdsToParse.add(response.databucketID);
      }
    });

    // capture databucket ids in found databuckets to allow for nested databucket parsing
    let nestedDatabucketIds: string[] = [];

    environment.data.forEach((databucket) => {
      if (
        databucketIdsToParse.has(databucket.id) ||
        [...databucketIdsToParse.keys()].some((id) =>
          databucket.name.toLowerCase().includes(id.toLowerCase())
        )
      ) {
        nestedDatabucketIds = [
          ...this.captureReferencedDatabucketIds(databucket.value)
        ];
      }
    });

    // add nested databucket ids at the beginning of the set to ensure they are parsed first
    databucketIdsToParse = new Set([
      ...nestedDatabucketIds,
      ...databucketIdsToParse
    ]);

    if (databucketIdsToParse.size > 0) {
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
          try {
            content = TemplateParser({
              shouldOmitDataHelper: false,
              content: targetDatabucket.value,
              environment,
              processedDatabuckets: this.processedDatabuckets,
              globalVariables: this.globalVariables,
              request,
              envVarsPrefix: this.options.envVarsPrefix
            });
            const JSONParsedcontent = JSON.parse(content);
            targetDatabucket.value = JSONParsedcontent;
            targetDatabucket.parsed = true;
          } catch (error: any) {
            if (error instanceof SyntaxError) {
              targetDatabucket.value = content;
            } else {
              targetDatabucket.value = error.message;
            }
            targetDatabucket.parsed = true;
          }
        }
      }
    }
  }

  /**
   * Set response properties from the locals object.
   * Currently supports the statusCode that can be set using templating helper.
   *
   * @param response
   */
  private applyResponseLocals(response: Response) {
    if (response.locals.statusCode !== undefined) {
      response.status(response.locals.statusCode);
    }
  }
}
