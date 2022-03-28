import { v4 as uuid } from 'uuid';
import {
  EnvironmentDefault,
  ResponseRuleDefault,
  RouteDefault,
  RouteResponseDefault
} from '../constants/environment-schema.constants';
import { CloneObject } from '../libs/utils';
import { Environment } from '../models/environment.model';
import {
  Header,
  Methods,
  ResponseRule,
  Route,
  RouteResponse
} from '../models/route.model';

/**
 * Build a new environment or route response header
 */
export const BuildHeader = (key = '', value = ''): Header => ({ key, value });

/**
 * Build a new route response
 */
export const BuildRouteResponse = (): RouteResponse => ({
  ...RouteResponseDefault
});

/**
 * Build a new response rule
 */
export const BuildResponseRule = (): ResponseRule => ({
  ...ResponseRuleDefault
});

/**
 * Clone a new route response with a fresh UUID
 */
export const CloneRouteResponse = (
  routeResponse: RouteResponse
): RouteResponse => ({
  ...CloneObject(routeResponse),
  uuid: uuid(),
  label: `${routeResponse.label} (copy)`
});

/**
 * Build a new route
 */
export const BuildRoute = (hasDefaultRouteResponse = true): Route => ({
  ...RouteDefault,
  responses: hasDefaultRouteResponse ? [BuildRouteResponse()] : []
});

/**
 * Build a new environment
 */
export const BuildEnvironment = (
  params: {
    hasDefaultRoute: boolean;
    hasDefaultHeader: boolean;
    port?: number;
  } = {
    hasDefaultRoute: true,
    hasDefaultHeader: true
  }
): Environment => ({
  ...EnvironmentDefault,
  port: params.port !== undefined ? params.port : EnvironmentDefault.port,
  routes: params.hasDefaultRoute ? [BuildRoute()] : [],
  headers: params.hasDefaultHeader
    ? [BuildHeader('Content-Type', 'application/json')]
    : [],
  proxyReqHeaders: [BuildHeader()],
  proxyResHeaders: [BuildHeader()]
});

/**
 * Build a demo environment when starting the application for the first time
 */
export const BuildDemoEnvironment = (): Environment => ({
  ...BuildEnvironment(),
  name: 'Demo API',
  routes: [
    {
      ...BuildRoute(),
      method: Methods.get,
      endpoint: 'users',
      documentation:
        'Generate random body (JSON, text, CSV, etc) with templating',
      responses: [
        {
          ...BuildRouteResponse(),
          label:
            "Creates 10 random users, or the amount specified in the 'total' query param",
          body: '{\n  "Templating example": "For more information about templating, click the blue \'i\' above this editor",\n  "users": [\n    {{# repeat (queryParam \'total\' \'10\') }}\n      {\n        "userId": "{{ faker \'random.number\' min=10000 max=100000 }}",\n        "firstname": "{{ faker \'name.firstName\' }}",\n        "lastname": "{{ faker \'name.lastName\' }}",\n        "friends": [\n          {{# repeat (faker \'random.number\' 5) }}\n            {\n              "id": "{{ faker \'random.uuid\' }}"\n            }\n          {{/ repeat }}\n        ]\n      },\n    {{/ repeat }}\n  ],\n  "total": "{{queryParam \'total\' \'10\'}}"\n}'
        }
      ]
    },
    {
      ...BuildRoute(),
      method: Methods.post,
      endpoint: 'content/:param1',
      documentation: 'Use multiple responses with rules',
      responses: [
        {
          ...BuildRouteResponse(),
          label: 'Default response',
          body: '{\n  "Rules example": "Default response. Served if route param \'param1\' is not present."\n}'
        },
        {
          ...BuildRouteResponse(),
          label: 'Content XYZ',
          body: "{\n  \"Rules example\": \"Content XYZ. Served if route param 'param1' equals 'xyz'. (See in 'Rules' tab)\"\n}",
          rules: [
            {
              target: 'params',
              modifier: 'param1',
              value: 'xyz',
              operator: 'equals'
            }
          ]
        },
        {
          ...BuildRouteResponse(),
          statusCode: 404,
          label: 'Content not found',
          body: "{\n  \"Rules example\": \"Content not found. Served if route param 'param1' is not equal to 'xyz'. (See in 'Rules' tab)\"\n}\n",
          rules: [
            {
              target: 'params',
              modifier: 'param1',
              value: '^(?!.*xyz).*$',
              operator: 'regex'
            }
          ]
        }
      ]
    },
    {
      ...BuildRoute(),
      method: Methods.get,
      endpoint: 'file/:pageName',
      documentation:
        "Serve a file dynamically depending on the path param 'pageName'.",
      responses: [
        {
          ...BuildRouteResponse(),
          label: 'Templating is also supported in file path',
          headers: [{ key: 'Content-Type', value: 'text/html' }],
          body: '',
          filePath: "./page{{urlParam 'pageName'}}.html"
        }
      ]
    },
    {
      ...BuildRoute(),
      method: Methods.put,
      endpoint: 'path/with/pattern(s)?/*',
      documentation: 'Path supports various patterns',
      responses: [
        {
          ...BuildRouteResponse(),
          headers: [{ key: 'Content-Type', value: 'text/plain' }],
          body: "The current path will match the following routes: \nhttp://localhost:3000/path/with/pattern/\nhttp://localhost:3000/path/with/patterns/\nhttp://localhost:3000/path/with/patterns/anything-else\n\nLearn more about Mockoon's routing: https://mockoon.com/docs/latest/routing"
        }
      ]
    },
    {
      ...BuildRoute(),
      method: Methods.get,
      endpoint: 'forward-and-record',
      documentation: 'Can Mockoon forward or record entering requests?',
      responses: [
        {
          ...BuildRouteResponse(),
          headers: [{ key: 'Content-Type', value: 'text/plain' }],
          body: "Mockoon can also act as a proxy and forward all entering requests that are not caught by declared routes. \nYou can activate this option in the environment settings ('cog' icon in the upper right corner). \nTo learn more: https://mockoon.com/docs/latest/proxy-mode\n\nAs always, all entering requests, and responses from the proxied server will be recorded ('clock' icon in the upper right corner).\nTo learn more: https://mockoon.com/docs/latest/requests-logging"
        }
      ]
    }
  ]
});
