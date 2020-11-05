import { Injectable } from '@angular/core';
import {
  BINARY_BODY,
  Environment,
  Environments,
  MockoonResponse,
  Route
} from '@mockoon/commons';
import { AscSort, ObjectValuesFlatten } from 'src/app/libs/utils.lib';
import { EnvironmentLog } from 'src/app/models/environment-logs.model';
import { Store } from 'src/app/stores/store';
import { parse as urlParse } from 'url';
import { v1 as uuid } from 'uuid';

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private store: Store) {}

  /**
   * Format request/response to EnvironmentLog to be consumed by the UI
   *
   * @param response
   */
  public formatLog(response: MockoonResponse): EnvironmentLog {
    const request = response.req;
    const flattenedRequestHeaders = ObjectValuesFlatten(request.headers);
    const flattenedResponseHeaders = ObjectValuesFlatten(response.getHeaders());

    return {
      UUID: uuid(),
      routeUUID: response.routeUUID,
      routeResponseUUID: response.routeResponseUUID,
      timestamp: new Date(),
      method: request.method,
      route: request.route ? request.route.path : null,
      url: urlParse(request.originalUrl).pathname,
      request: {
        params: request.params
          ? Object.keys(request.params).map((paramName) => ({
              name: paramName,
              value: request.params[paramName]
            }))
          : [],
        queryParams: request.query
          ? Object.keys(request.query).map((queryParamName) => ({
              name: queryParamName,
              value: request.query[queryParamName] as string
            }))
          : [],
        body: request.body,
        headers: Object.keys(flattenedRequestHeaders)
          .map((headerName) => ({
              key: headerName,
              value: flattenedRequestHeaders[headerName]
            }))
          .sort(AscSort)
      },
      proxied: request.proxied || false,
      response: {
        status: response.statusCode,
        headers: Object.keys(flattenedResponseHeaders)
          .map((headerName) => ({
              key: headerName,
              value: flattenedResponseHeaders[headerName]
            }))
          .sort(AscSort),
        body: response.body,
        binaryBody: response.body === BINARY_BODY
      }
    };
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
    environments.forEach((environment) => {
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

    environment.routes.forEach((route) => {
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

    route.responses.forEach((routeResponse) => {
      routeResponse.uuid = erase ? '' : uuid();
    });

    return route;
  }

  /**
   * Truncate the body to the maximum length defined in the settings
   *
   * @param body
   */
  public truncateBody(body: string) {
    const logSizeLimit = this.store.get('settings').logSizeLimit;

    if (body.length > logSizeLimit) {
      body =
        body.substring(0, logSizeLimit) +
        '\n\n-------- BODY HAS BEEN TRUNCATED --------';
    }

    return body;
  }
}
