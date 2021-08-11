import { Injectable } from '@angular/core';
import {
  Environment,
  Header,
  ResponseRule,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { cloneDeep } from 'lodash';
import {
  EnvironmentDefault,
  ResponseRuleDefault,
  RouteDefault,
  RouteResponseDefault
} from 'src/renderer/app/constants/environment-schema.constants';
import { DataService } from 'src/renderer/app/services/data.service';
import { v4 as uuid } from 'uuid';

@Injectable({ providedIn: 'root' })
export class SchemasBuilderService {
  constructor(private dataService: DataService) {}

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
      ...RouteResponseDefault
    };
  }

  /**
   * Build a new response rule
   */
  public buildResponseRule(): ResponseRule {
    return {
      ...ResponseRuleDefault
    };
  }

  /**
   * Clone a new route response with a fresh UUID
   */
  public cloneRouteResponse(routeResponse: RouteResponse): RouteResponse {
    return {
      ...cloneDeep(routeResponse),
      uuid: uuid(),
      label: `${routeResponse.label} (copy)`
    };
  }

  /**
   * Build a new route
   */
  public buildRoute(hasDefaultRouteResponse = true): Route {
    return {
      ...RouteDefault,
      responses: hasDefaultRouteResponse ? [this.buildRouteResponse()] : []
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
      ...EnvironmentDefault,
      port: this.dataService.getNewEnvironmentPort(),
      routes: hasDefaultRoute ? [this.buildRoute()] : [],
      headers: hasDefaultHeader
        ? [this.buildHeader('Content-Type', 'application/json')]
        : [],
      proxyReqHeaders: [this.buildHeader()],
      proxyResHeaders: [this.buildHeader()]
    };
  }

  /**
   * Build a demo environment when starting the application for the first time
   */
  public buildDemoEnvironment(): Environment {
    return {
      ...this.buildEnvironment(),
      name: 'Demo API',
      routes: [
        {
          ...this.buildRoute(),
          method: 'get',
          endpoint: 'users',
          documentation:
            'Generate random body (JSON, text, CSV, etc) with templating',
          responses: [
            {
              ...this.buildRouteResponse(),
              label:
                "Creates 10 random users, or the amount specified in the 'total' query param",
              body: '{\n  "Templating example": "For more information about templating, click the blue \'i\' above this editor",\n  "users": [\n    {{# repeat (queryParam \'total\' \'10\') }}\n      {\n        "userId": "{{ faker \'random.number\' min=10000 max=100000 }}",\n        "firstname": "{{ faker \'name.firstName\' }}",\n        "lastname": "{{ faker \'name.lastName\' }}",\n        "friends": [\n          {{# repeat (faker \'random.number\' 5) }}\n            {\n              "id": "{{ faker \'random.uuid\' }}"\n            }\n          {{/ repeat }}\n        ]\n      },\n    {{/ repeat }}\n  ],\n  "total": "{{queryParam \'total\' \'10\'}}"\n}'
            }
          ]
        },
        {
          ...this.buildRoute(),
          method: 'post',
          endpoint: 'content/:param1',
          documentation: 'Use multiple responses with rules',
          responses: [
            {
              ...this.buildRouteResponse(),
              label: 'Default response',
              body: '{\n  "Rules example": "Default response. Served if route param \'param1\' is not present."\n}'
            },
            {
              ...this.buildRouteResponse(),
              label: 'Content XYZ',
              body: "{\n  \"Rules example\": \"Content XYZ. Served if route param 'param1' equals 'xyz'. (See in 'Rules' tab)\"\n}",
              rules: [
                {
                  target: 'params',
                  modifier: 'param1',
                  value: 'xyz',
                  isRegex: false
                }
              ]
            },
            {
              ...this.buildRouteResponse(),
              statusCode: 404,
              label: 'Content not found',
              body: "{\n  \"Rules example\": \"Content not found. Served if route param 'param1' is not equal to 'xyz'. (See in 'Rules' tab)\"\n}\n",
              rules: [
                {
                  target: 'params',
                  modifier: 'param1',
                  value: '^(?!.*xyz).*$',
                  isRegex: true
                }
              ]
            }
          ]
        },
        {
          ...this.buildRoute(),
          method: 'get',
          endpoint: 'file/:pageName',
          documentation:
            "Serve a file dynamically depending on the path param 'pageName'.",
          responses: [
            {
              ...this.buildRouteResponse(),
              label: 'Templating is also supported in file path',
              headers: [{ key: 'Content-Type', value: 'text/html' }],
              body: '',
              filePath: "./page{{urlParam 'pageName'}}.html"
            }
          ]
        },
        {
          ...this.buildRoute(),
          method: 'put',
          endpoint: 'path/with/pattern(s)?/*',
          documentation: 'Path supports various patterns',
          responses: [
            {
              ...this.buildRouteResponse(),
              headers: [{ key: 'Content-Type', value: 'text/plain' }],
              body: "The current path will match the following routes: \nhttp://localhost:3000/path/with/pattern/\nhttp://localhost:3000/path/with/patterns/\nhttp://localhost:3000/path/with/patterns/anything-else\n\nLearn more about Mockoon's routing: https://mockoon.com/docs/latest/routing"
            }
          ]
        },
        {
          ...this.buildRoute(),
          method: 'get',
          endpoint: 'forward-and-record',
          documentation: 'Can Mockoon forward or record entering requests?',
          responses: [
            {
              ...this.buildRouteResponse(),
              headers: [{ key: 'Content-Type', value: 'text/plain' }],
              body: "Mockoon can also act as a proxy and forward all entering requests that are not caught by declared routes. \nYou can activate this option in the environment settings ('cog' icon in the upper right corner). \nTo learn more: https://mockoon.com/docs/latest/proxy-mode\n\nAs always, all entering requests, and responses from the proxied server will be recorded ('clock' icon in the upper right corner).\nTo learn more: https://mockoon.com/docs/latest/requests-logging"
            }
          ]
        }
      ]
    };
  }
}
