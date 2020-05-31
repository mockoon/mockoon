import { Injectable } from '@angular/core';
import { HighestMigrationId } from 'src/app/libs/migrations.lib';
import { DataService } from 'src/app/services/data.service';
import { Environment } from 'src/app/types/environment.type';
import { Header, Route, RouteResponse } from 'src/app/types/route.type';
import { v1 as uuid } from 'uuid';

@Injectable({ providedIn: 'root' })
export class SchemasBuilderService {
  constructor(private dataService: DataService) {
  }

  /**
   * Build a new environment or route response header
   */
  public buildHeader(key = '', value = ''): Header {
    return { key, value };
  }

  /**
   * Build a new route response
   */
  public buildRouteResponse(): RouteResponse {
    return {
      uuid: uuid(),
      body: '{}',
      latency: 0,
      statusCode: '200',
      label: '',
      headers: [this.buildHeader()],
      filePath: '',
      sendFileAsBody: false,
      rules: []
    };
  }

  /**
   * Clone a new route response with a fresh UUID
   */
  public cloneRouteResponse(routeResponse: RouteResponse): RouteResponse {
    return {
      ...routeResponse,
      uuid: uuid()
    };
  }

  /**
   * Build a new route
   */
  public buildRoute(hasDefaultRouteResponse = true): Route {
    return {
      uuid: uuid(),
      documentation: '',
      method: 'get',
      endpoint: '',
      responses: hasDefaultRouteResponse ? [this.buildRouteResponse()] : [],
      enabled: true
    };
  }

  /**
   * Build a new environment
   */
  public buildEnvironment(
    hasDefaultRoute = true,
    hasDefaultHeader = true
  ): Environment {
    return {
      uuid: uuid(),
      lastMigration: HighestMigrationId,
      name: 'New environment',
      endpointPrefix: '',
      latency: 0,
      port: this.dataService.getNewEnvironmentPort(),
      routes: hasDefaultRoute ? [this.buildRoute()] : [],
      proxyMode: false,
      proxyHost: '',
      https: false,
      cors: true,
      headers: hasDefaultHeader
        ? [this.buildHeader('Content-Type', 'application/json')]
        : [],
      proxyReqHeaders: [this.buildHeader()],
      proxyResHeaders: [this.buildHeader()]
    };
  }

  /**
   * Build a default environment when starting the application for the first time
   */
  public buildDefaultEnvironment(): Environment {
    return {
      ...this.buildEnvironment(),
      name: 'Demo users API',
      routes: [
        {
          ...this.buildRoute(),
          method: 'get',
          endpoint: 'users',
          documentation: 'Get all users',
          responses: [
            {
              ...this.buildRouteResponse(),
              statusCode: '200',
              label: 'Success',
              latency: 50,
              headers: [{ key: 'Content-Type', value: 'application/json' }],
              body:
                '[\n  {\n    "id": 1,\n    "firstname": "John",\n    "Lastname": "Snow",' +
                '\n    "status": "Learning things"\n  },\n  {\n    "id": 2,\n    "firstname": "Daenerys",\n    "Lastname": "Targaryen",\n    "status": "Riding a dragon"\n  }\n]'
            }
          ]
        },
        {
          ...this.buildRoute(),
          method: 'get',
          endpoint: 'users/:id',
          documentation: 'Get a user',
          responses: [
            {
              ...this.buildRouteResponse(),
              statusCode: '200',
              label: 'Get userId 1',
              headers: [{ key: 'Content-Type', value: 'application/json' }],
              body:
                '{\n  "id": 1,\n  "firstname": "John",\n  "Lastname": "Snow",\n  "status": "Learning things"\n}',
              rules: [
                {
                  target: 'params',
                  modifier: 'id',
                  value: '1',
                  isRegex: false
                }
              ]
            },
            {
              ...this.buildRouteResponse(),
              statusCode: '200',
              label: 'Get userId 2',
              headers: [{ key: 'Content-Type', value: 'application/json' }],
              body:
                '{\n  "id": 2,\n  "firstname": "Daenerys",\n  "Lastname": "Targaryen",\n  "status": "Riding a dragon"\n}',
              rules: [
                {
                  target: 'params',
                  modifier: 'id',
                  value: '2',
                  isRegex: false
                }
              ]
            }
          ]
        },
        {
          ...this.buildRoute(),
          method: 'post',
          endpoint: 'users',
          documentation: 'Create a user',
          responses: [
            {
              ...this.buildRouteResponse(),
              statusCode: '201',
              label: 'Success',
              headers: [{ key: 'Content-Type', value: 'application/json' }],
              body:
                '{\n  "firstname": "{{body \'firstname\'}}",\n  "lastname": "{{body \'lastname\'}}",\n  "status": "{{body \'status\'}}"\n}',
              rules: [
                {
                  target: 'body',
                  modifier: 'firstname',
                  value: '.+',
                  isRegex: true
                }
              ]
            },
            {
              ...this.buildRouteResponse(),
              statusCode: '400',
              label: 'Missing data',
              headers: [{ key: 'Content-Type', value: 'application/json' }],
              body: '{\n  "Error": "firstname is required"\n}',
              rules: [
                {
                  target: 'body',
                  modifier: 'firstname',
                  value: '^$',
                  isRegex: true
                }
              ]
            }
          ]
        },
        {
          ...this.buildRoute(),
          method: 'delete',
          endpoint: 'users/:id',
          documentation: 'Delete a user',
          responses: [
            {
              ...this.buildRouteResponse(),
              statusCode: '204',
              label: 'User deleted',
              headers: [{ key: 'Content-Type', value: 'application/json' }],
              body: '',
              rules: [
                {
                  target: 'body',
                  modifier: 'firstname',
                  value: '.*',
                  isRegex: true
                }
              ]
            }
          ]
        }
      ]
    };
  }
}
