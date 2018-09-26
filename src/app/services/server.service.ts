import { Injectable } from '@angular/core';
import { Config } from 'src/app/config';
import { Errors } from 'src/app/enums/errors.enum';
import { DummyJSONHelpers } from 'src/app/libs/dummy-helpers.lib';
import { AlertService } from 'src/app/services/alert.service';
import { DataService } from 'src/app/services/data.service';
import { pemFiles } from 'src/app/ssl';
import { EnvironmentType } from 'src/app/types/environment.type';
import { RouteType } from 'src/app/types/route.type';
import { EnvironmentLogsType } from 'src/app/types/server.type';
import * as DummyJSON from 'dummy-json';
import * as express from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as proxy from 'http-proxy-middleware';
import * as https from 'https';
import * as killable from 'killable';
import * as mime from 'mime-types';
import * as path from 'path';
import { URL } from 'url';

const httpsConfig = {
  key: pemFiles.key,
  cert: pemFiles.cert
};

@Injectable()
export class ServerService {
  public environmentsLogs: EnvironmentLogsType = {};

  constructor(private alertService: AlertService, private dataService: DataService) { }

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

  public testCustomHeader(key: string) {
    if (key.match(/[^A-Za-z0-9\-\!\#\$\%\&\'\*\+\.\^\_\`\|\~]/g)) {
      return true;
    }
    return false;
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
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Origin, Accept, Authorization, Content-Length, X-Requested-With');

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
        server[route.method]('/' + ((environment.endpointPrefix) ? environment.endpointPrefix + '/' : '') + route.endpoint, (req, res) => {
          // add route latency if any
          setTimeout(() => {
            // set http code
            res.status(route.statusCode);

            // set custom headers
            route.customHeaders.forEach((customHeader) => {
              if (customHeader.key && customHeader.value && !this.testCustomHeader(customHeader.key)) {
                res.set(customHeader.key, customHeader.value);
              }
            });

            if (route.file) {
              let fileContent;

              // throw error or serve file
              try {
                fileContent = fs.readFileSync(route.file.path);

                // Set content type, set content disposition and send Buffer
                if (!this.getCustomHeader(route, 'Content-Type')) {
                  res.set('Content-Type', mime.lookup(route.file.path));
                }

                res.set('Content-Disposition', `attachment; filename="${path.basename(route.file.path)}"`);
                res.send(fileContent);
              } catch (error) {
                if (error.code === 'ENOENT') {
                  this.alertService.showAlert('error', Errors.FILE_NOT_EXISTS);

                  res.set('Content-Type', 'text/plain');
                  res.send(Errors.FILE_NOT_EXISTS);
                }
              }
            } else {
              // detect if content type is json in order to parse
              if (this.getCustomHeader(route, 'Content-Type') === 'application/json') {
                try {
                  res.json(JSON.parse(DummyJSON.parse(route.body, { helpers: DummyJSONHelpers(req) })));
                } catch (error) {
                  // if JSON parsing error send plain text error
                  if (error.message.indexOf('Unexpected token') >= 0 || error.message.indexOf('Parse error') >= 0) {
                    this.alertService.showAlert('error', Errors.JSON_PARSE);
                    res.set('Content-Type', 'text/plain');
                    res.send(Errors.JSON_PARSE);
                  }
                  res.end();
                }
              } else {
                try {
                  res.send(route.body);
                } catch (error) {
                  // if invalide Content-Type provided
                  if (error.message.indexOf('invalid media type') >= 0) {
                    this.alertService.showAlert('error', Errors.INVALID_CONTENT_TYPE);
                    res.set('Content-Type', 'text/plain');
                    res.send(Errors.INVALID_CONTENT_TYPE);
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
   * Return the content type header value
   *
   * @param route
   */
  public getCustomHeader(route: RouteType, headerName: string): string {
    const header = route.customHeaders.find(customHeader => customHeader.key === headerName);

    return (header && header.value) || '';
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
