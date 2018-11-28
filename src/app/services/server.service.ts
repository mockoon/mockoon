import { Injectable } from '@angular/core';
import * as express from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as proxy from 'http-proxy-middleware';
import * as https from 'https';
import * as killable from 'killable';
import * as path from 'path';
import { Config } from 'src/app/config';
import { AnalyticsEvents } from 'src/app/enums/analytics-events.enum';
import { Errors } from 'src/app/enums/errors.enum';
import { DummyJSONParser } from 'src/app/libs/dummy-helpers.lib';
import { AlertService } from 'src/app/services/alert.service';
import { DataService } from 'src/app/services/data.service';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { EventsService } from 'src/app/services/events.service';
import { pemFiles } from 'src/app/ssl';
import { EnvironmentType } from 'src/app/types/environment.type';
import { CORSHeaders, HeaderType, mimeTypesWithTemplating, RouteType } from 'src/app/types/route.type';
import { EnvironmentLogsType } from 'src/app/types/server.type';
import { URL } from 'url';

const httpsConfig = {
  key: pemFiles.key,
  cert: pemFiles.cert
};

@Injectable()
export class ServerService {
  public environmentsLogs: EnvironmentLogsType = {};

  constructor(
    private alertService: AlertService,
    private dataService: DataService,
    private eventsService: EventsService,
    private environmentService: EnvironmentsService
  ) {
    this.eventsService.environmentDeleted.subscribe((environment: EnvironmentType) => {
      // stop if needed before deletion
      if (environment.running) {
        this.stop(environment);
      }

      // delete the request logs
      this.deleteEnvironmentLogs(environment.uuid);
    });
  }

  /**
   * Start an environment / server
   *
   * @param environment - an environment
   */
  public start(environment: EnvironmentType) {
    const server = express();
    let serverInstance;

    // create https or http server instance
    if (environment.https) {
      serverInstance = https.createServer(httpsConfig, server);
    } else {
      serverInstance = http.createServer(server);
    }

    // listen to port
    serverInstance.listen(environment.port, (error, success) => {
      environment.instance = serverInstance;
      environment.running = true;
      environment.startedAt = new Date();
    });

    // apply latency, cors, routes and proxy to express server
    this.analytics(server);
    this.rewriteUrl(server);
    this.parseBody(server);
    this.logRequests(server, environment);
    this.setEnvironmentLatency(server, environment);
    this.setRoutes(server, environment);
    this.setCors(server, environment);
    this.enableProxy(server, environment);

    // handle server errors
    serverInstance.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        this.alertService.showAlert('error', Errors.PORT_ALREADY_USED);
      } else if (error.code === 'EACCES') {
        this.alertService.showAlert('error', Errors.PORT_INVALID);
      } else {
        this.alertService.showAlert('error', error.message);
      }
    });

    killable(serverInstance);
  }

  /**
   * Completely stop an environment / server
   *
   * @param environment - an environment
   */
  public stop(environment: EnvironmentType) {
    if (environment.instance) {
      environment.instance.kill(() => {
        environment.instance = null;
        environment.running = false;
        environment.startedAt = null;
      });
    }
  }

  /**
   * Test a header validity
   *
   * @param headerName
   */
  public testHeaderValidity(headerName: string) {
    if (headerName.match(/[^A-Za-z0-9\-\!\#\$\%\&\'\*\+\.\^\_\`\|\~]/g)) {
      return true;
    }
    return false;
  }

  /**
   * Send event for all entering requests
   *
   * @param server - express instance
   */
  private analytics(server: any) {
    server.use((req, res, next) => {
      this.eventsService.analyticsEvents.next(AnalyticsEvents.SERVER_ENTERING_REQUEST);

      next();
    });
  }

  /**
   * Remove multiple slash and replace by single slash
   *
   * @param server - express instance
   */
  private rewriteUrl(server: any) {
    server.use((req, res, next) => {
      req.url = req.url.replace(/\/{2,}/g, '/');

      next();
    });
  }

  /**
   * Always answer with status 200 to CORS pre flight OPTIONS requests if option activated.
   * /!\ Must be called after the routes creation otherwise it will intercept all user defined OPTIONS routes.
   *
   * @param server - express instance
   * @param environment - environment to be started
   */
  private setCors(server: any, environment: EnvironmentType) {
    if (environment.cors) {
      server.options('/*', (req, res) => {
        CORSHeaders.forEach(CORSHeader => {
          res.header(CORSHeader.key, CORSHeader.value);
        });

        res.send(200);
      });
    }
  }

  /**
   * Generate an environment routes and attach to running server
   *
   * @param server - server on which attach routes
   * @param environment - environment to get route schema from
   */
  private setRoutes(server: any, environment: EnvironmentType) {
    environment.routes.forEach((route: RouteType) => {
      // only launch non duplicated routes
      if (!route.duplicates.length) {
        // create route
        server[route.method]('/' + ((environment.endpointPrefix) ? environment.endpointPrefix + '/' : '') + route.endpoint.replace(/ /g, '%20'), (req, res) => {
          // add route latency if any
          setTimeout(() => {
            const routeContentType = this.environmentService.getRouteContentType(environment, route);

            // set http code
            res.status(route.statusCode);

            this.setHeaders(environment.headers, req, res);
            this.setHeaders(route.headers, req, res);

            // send the file
            if (route.file) {
              const filePath = DummyJSONParser(route.file.path, req);

              // throw error or serve file
              try {
                // if no route content type set to the one detected
                if (!routeContentType) {
                  res.set('Content-Type', route.file.mimeType);
                }

                let fileContent: Buffer | string = fs.readFileSync(filePath);

                // parse templating for a limited list of mime types
                if (mimeTypesWithTemplating.indexOf(route.file.mimeType) > -1) {
                  fileContent = DummyJSONParser(fileContent.toString('utf-8', 0, fileContent.length), req);
                }

                if (!route.file.sendAsBody) {
                  res.set('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
                }
                res.send(fileContent);
              } catch (error) {
                if (error.code === 'ENOENT') {
                  this.sendError(res, Errors.FILE_NOT_EXISTS + filePath);
                }
                res.end();
              }
            } else {
              // detect if content type is json in order to parse
              if (routeContentType === 'application/json') {
                try {
                  res.json(JSON.parse(DummyJSONParser(route.body, req)));
                } catch (error) {
                  // if JSON parsing error send plain text error
                  if (error.message.indexOf('Unexpected token') >= 0 || error.message.indexOf('Parse error') >= 0) {
                    this.sendError(res, Errors.JSON_PARSE);
                  } else if (error.message.indexOf('Missing helper') >= 0) {
                    this.sendError(res, Errors.MISSING_HELPER + error.message.split('"')[1]);
                  }
                  res.end();
                }
              } else {
                try {
                  res.send(DummyJSONParser(route.body, req));
                } catch (error) {
                  // if invalide Content-Type provided
                  if (error.message.indexOf('invalid media type') >= 0) {
                    this.sendError(res, Errors.INVALID_CONTENT_TYPE);
                  }
                  res.end();
                }
              }
            }
          }, route.latency);
        });
      }
    });
  }

  private setHeaders(headers: HeaderType[], req, res) {
    headers.forEach((header) => {
      if (header.key && header.value && !this.testHeaderValidity(header.key)) {
        res.set(header.key, DummyJSONParser(header.value, req));
      }
    });
  }

  /**
   * Send an error with text/plain content type and the provided message.
   * Also display a toast.
   *
   * @param res
   * @param errorMessage
   */
  private sendError(res: any, errorMessage: string) {
    this.alertService.showAlert('error', errorMessage);
    res.set('Content-Type', 'text/plain');
    res.send(errorMessage);
  }

  /**
   * Enable catch all proxy.
   * Restream the body to the proxied API because it already has been intercepted by body parser
   *
   * @param server - server on which to launch the proxy
   * @param environment - environment to get proxy settings from
   */
  private enableProxy(server: any, environment: EnvironmentType) {
    // Add catch all proxy if enabled
    if (environment.proxyMode && environment.proxyHost && this.isValidURL(environment.proxyHost)) {
      // res-stream the body (intercepted by body parser method) and mark as proxied
      const processRequest = (proxyReq, req, res, options) => {
        req.proxied = true;

        if (req.body) {
          proxyReq.setHeader('Content-Length', Buffer.byteLength(req.body));
          // stream the content
          proxyReq.write(req.body);
        }
      };

      server.use('*', proxy({
        target: environment.proxyHost,
        secure: false,
        changeOrigin: true,
        ssl: Object.assign({}, httpsConfig, { agent: false }),
        onProxyReq: processRequest
      }));
    }
  }

  /**
   * Parse body as a raw string
   *
   * @param server - server on which to parse the body
   */
  private parseBody(server: any) {
    try {
      server.use((req, res, next) => {
        req.setEncoding('utf8');
        req.body = '';

        req.on('data', (chunk) => {
          req.body += chunk;
        });

        req.on('end', () => {
          next();
        });
      });
    } catch (error) {

    }
  }

  /**
   * Logs all request made to the environment
   *
   * @param server - server on which to log the request
   * @param environment - environment to link log to
   */
  private logRequests(server: any, environment: EnvironmentType) {
    server.use((req, res, next) => {
      let environmentLogs = this.environmentsLogs[environment.uuid];
      if (!environmentLogs) {
        this.environmentsLogs[environment.uuid] = [];
        environmentLogs = this.environmentsLogs[environment.uuid];
      }

      // remove one at the end if we reach maximum
      if (environmentLogs.length >= Config.maxLogsPerEnvironment) {
        environmentLogs.pop();
      }

      environmentLogs.unshift(this.dataService.formatRequestLog(req));

      next();
    });
  }

  /**
   * Set the environment latency if any
   *
   * @param server - server instance
   * @param environment - environment
   */
  private setEnvironmentLatency(server: any, environment: EnvironmentType) {
    if (environment.latency > 0) {
      server.use((req, res, next) => {
        setTimeout(next, environment.latency);
      });
    }
  }

  /**
   * Test if URL is valid
   *
   * @param URL
   */
  public isValidURL(address: string): boolean {
    try {
      const myURL = new URL(address);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Clear the environment logs
   *
   * @param environmentUuid
   */
  public clearEnvironmentLogs(environmentUuid: string) {
    this.environmentsLogs[environmentUuid] = [];
  }

  /**
   * Delete an environment log
   *
   * @param environmentUuid
   */
  public deleteEnvironmentLogs(environmentUuid: string) {
    delete this.environmentsLogs[environmentUuid];
  }
}
