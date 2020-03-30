import { Injectable } from '@angular/core';
import { AscSort } from 'src/app/libs/utils.lib';
import { Store } from 'src/app/stores/store';
import { Environment, Environments } from 'src/app/types/environment.type';
import { Route } from 'src/app/types/route.type';
import { EnvironmentLog, EnvironmentLogResponse } from 'src/app/types/server.type';
import { parse as urlParse } from 'url';
import { v1 as uuid } from 'uuid';

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private store: Store) {}

  /**
   * Format a request log
   *
   * @param request
   */
  public formatRequestLog(request: any): EnvironmentLog {
    // use some getter to keep the scope because some request properties are being defined later by express (route, params, etc)
    const maxLength = this.store.get('settings').logSizeLimit;
    const requestLog: EnvironmentLog = {
      uuid: request.uuid,
      timestamp: new Date(),
      get route() {
        return request.route ? request.route.path : null;
      },
      method: request.method,
      protocol: request.protocol,
      url: urlParse(request.originalUrl).pathname,
      headers: [],
      get proxied() {
        return request.proxied;
      },
      get params() {
        if (request.params) {
          return Object.keys(request.params).map(paramName => {
            return { name: paramName, value: request.params[paramName] };
          });
        }

        return [];
      },
      get queryParams() {
        if (request.query) {
          return Object.keys(request.query).map(queryParamName => {
            return {
              name: queryParamName,
              value: request.query[queryParamName]
            };
          });
        }

        return [];
      },
      get body() {
        let truncatedBody: string = request.body;

        // truncate
        if (truncatedBody.length > maxLength) {
          truncatedBody =
            truncatedBody.substring(0, maxLength) +
            '\n\n-------- BODY HAS BEEN TRUNCATED --------';
        }

        return truncatedBody;
      },
      response: null
    };

    // get and sort headers
    requestLog.headers = Object.keys(request.headers)
      .map(headerName => {
        return { name: headerName, value: request.headers[headerName] };
      })
      .sort(AscSort);

    return requestLog;
  }

  /**
   * Format a response log
   *
   * @param response
   * @param body
   * @param requestUUID
   */
  public formatResponseLog(
    response: any,
    body: string,
    requestUUID: string
  ): EnvironmentLogResponse {
    // if don't have uuid it can't be found, so let's return null and consider this an error
    if (requestUUID == null) {
      return null;
    }

    // use some getter to keep the scope because some request properties are being defined later by express (route, params, etc)
    const responseLog: EnvironmentLogResponse = {
      requestUUID: requestUUID,
      status: response.statusCode,
      headers: [],
      body: ''
    };
    // get and sort headers
    const headers = response.getHeaders();
    responseLog.headers = Object.keys(headers)
      .map(headerName => {
        return { name: headerName, value: headers[headerName] };
      })
      .sort(AscSort);

    const maxLength = this.store.get('settings').logSizeLimit;
    responseLog.body = (function() {
      let truncatedBody: string = body;

      // truncate
      if (truncatedBody.length > maxLength) {
        truncatedBody =
          truncatedBody.substring(0, maxLength) +
          '\n\n-------- BODY HAS BEEN TRUNCATED --------';
      }

      return truncatedBody;
    })();

    return responseLog;
  }

  /**
   * Generate a unused port to a new environment
   */
  public getNewEnvironmentPort(): number {
    const usedPorts = this.store.getEnvironmentsPorts();
    const activeEnvironment: Environment = this.store.getActiveEnvironment();
    const min = Math.ceil(1024);
    const max = Math.floor(65535);
    let testSelectedPort: number;

    if (activeEnvironment == null) {
      testSelectedPort = 3000;
    } else {
      testSelectedPort = activeEnvironment.port + 1;
    }

    for (let i = 0; i < 10; i++) {
      if (testSelectedPort >= 65535) {
        break;
      } else if (!usedPorts.includes(testSelectedPort)) {
        return testSelectedPort;
      }
      testSelectedPort++;
    }

    do {
      testSelectedPort = Math.floor(Math.random() * (max - min)) + min;
    } while (usedPorts.includes(testSelectedPort));

    return testSelectedPort;
  }

  /**
   * Renew all environments UUIDs
   *
   * @param environments
   * @param subject
   */
  public renewEnvironmentsUUIDs(environments: Environments, erase = false) {
    environments.forEach(environment => {
      this.renewEnvironmentUUIDs(environment, erase);
    });

    return environments;
  }

  /**
   * Renew one environment UUIDs
   *
   * @param params
   */
  public renewEnvironmentUUIDs(environment: Environment, erase = false) {
    environment.uuid = erase ? '' : uuid();

    environment.routes.forEach(route => {
      this.renewRouteUUIDs(route, erase);
    });

    return environment;
  }

  /**
   * Renew one route UUIDs
   *
   * @param params
   */
  public renewRouteUUIDs(route: Route, erase = false) {
    route.uuid = erase ? '' : uuid();

    route.responses.forEach(routeResponse => {
      routeResponse.uuid = erase ? '' : uuid();
    });

    return route;
  }
}
