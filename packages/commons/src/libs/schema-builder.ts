import {
  DataBucketDefault,
  EnvironmentDefault,
  FolderDefault,
  ResponseRuleDefault,
  RouteDefault,
  RouteResponseDefault
} from '../constants/environment-schema.constants';
import { CloneObject, generateUUID } from '../libs/utils';
import { DataBucket, Environment } from '../models/environment.model';
import { Folder } from '../models/folder.model';
import {
  BodyTypes,
  Header,
  Methods,
  ResponseMode,
  ResponseRule,
  Route,
  RouteResponse,
  RouteType
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
  uuid: generateUUID(),
  label: `${routeResponse.label} (copy)`,
  default: false
});

/**
 * Build a new folder object in the folder tree
 */
export const BuildFolder = (): Folder => ({
  ...FolderDefault
});

/**
 * Build a new HTTP route
 */
export const BuildHTTPRoute = (
  hasDefaultRouteResponse = true,
  options: {
    endpoint: typeof RouteDefault.endpoint;
    body: typeof RouteResponseDefault.body;
  } = {
    endpoint: RouteDefault.endpoint,
    body: RouteResponseDefault.body
  }
): Route => {
  const defaultResponse = {
    ...BuildRouteResponse(),
    default: true,
    body: options.body
  };

  return {
    ...RouteDefault,
    type: RouteType.HTTP,
    method: Methods.get,
    endpoint: options.endpoint,
    responses: hasDefaultRouteResponse ? [defaultResponse] : []
  };
};

/**
 * Build a new CRUD route
 */
export const BuildCRUDRoute = (
  hasDefaultRouteResponse = true,
  options: {
    endpoint: typeof RouteDefault.endpoint;
    databucketID: typeof RouteResponseDefault.databucketID;
  } = {
    endpoint: RouteDefault.endpoint,
    databucketID: RouteResponseDefault.databucketID
  }
): Route => {
  let defaultResponse = { ...BuildRouteResponse(), default: true };

  defaultResponse = {
    ...defaultResponse,
    bodyType: BodyTypes.DATABUCKET,
    databucketID: options.databucketID
  };

  return {
    ...RouteDefault,
    type: RouteType.CRUD,
    method: '',
    endpoint: options.endpoint,
    responses: hasDefaultRouteResponse ? [defaultResponse] : []
  };
};

/**
 * Build a new databucket
 */
export const BuildDatabucket = (
  dataBucket: Partial<DataBucket> = {
    name: DataBucketDefault.name,
    value: DataBucketDefault.value
  }
): DataBucket => ({
  ...DataBucketDefault,
  ...dataBucket
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
): Environment => {
  const newRoute = BuildHTTPRoute();

  return {
    ...EnvironmentDefault,
    port: params.port !== undefined ? params.port : EnvironmentDefault.port,
    routes: params.hasDefaultRoute ? [newRoute] : [],
    headers: params.hasDefaultHeader
      ? [BuildHeader('Content-Type', 'application/json')]
      : [],
    proxyReqHeaders: [BuildHeader()],
    proxyResHeaders: [BuildHeader()],
    rootChildren: params.hasDefaultRoute
      ? [{ type: 'route', uuid: newRoute.uuid }]
      : []
  };
};

/**
 * Build a demo environment when starting the application for the first time
 */
export const BuildDemoEnvironment = (): Environment => {
  const databucket = BuildDatabucket();
  const newRoutes = [
    BuildHTTPRoute(),
    { ...BuildCRUDRoute() },
    BuildHTTPRoute(),
    BuildHTTPRoute(),
    BuildHTTPRoute(),
    BuildHTTPRoute(),
    BuildHTTPRoute()
  ];

  return {
    ...BuildEnvironment(),
    name: 'Demo API',
    data: [
      {
        ...databucket,
        name: 'Users',
        value:
          '[\n  {{#repeat 50}}\n  {\n    "id": "{{faker \'datatype.uuid\'}}",\n    "username": "{{faker \'internet.userName\'}}"\n  }\n  {{/repeat}}\n]'
      }
    ],
    routes: [
      {
        ...newRoutes[0],
        method: Methods.all,
        endpoint: '*',
        documentation: 'Global rules',
        responseMode: ResponseMode.FALLBACK,
        responses: [
          {
            ...BuildRouteResponse(),
            label: "Requires the presence of an 'Authorization' header",
            body: '{\n  "error": "Unauthorized"\n}',
            statusCode: 401,
            rules: [
              {
                target: 'header',
                modifier: 'Authorization',
                operator: 'null',
                invert: false,
                value: ''
              }
            ]
          }
        ]
      },
      {
        ...newRoutes[1],
        endpoint: 'users',
        documentation: 'Endpoint performing CRUD operations on a data bucket',
        responses: [
          { ...newRoutes[1].responses[0], databucketID: databucket.id }
        ]
      },
      {
        ...newRoutes[2],
        method: Methods.get,
        endpoint: 'template',
        documentation:
          'Generate random body (JSON, text, CSV, etc) with templating',
        responses: [
          {
            ...BuildRouteResponse(),
            label:
              "Creates 10 random users, or the amount specified in the 'total' query param",
            body: '{\n  "Templating example": "For more information about templating, click the blue \'i\' above this editor",\n  "users": [\n    {{# repeat (queryParam \'total\' \'10\') }}\n      {\n        "userId": "{{ faker \'datatype.number\' min=10000 max=100000 }}",\n        "firstname": "{{ faker \'name.firstName\' }}",\n        "lastname": "{{ faker \'name.lastName\' }}",\n        "friends": [\n          {{# repeat (faker \'datatype.number\' 5) }}\n            {\n              "id": "{{ faker \'datatype.uuid\' }}"\n            }\n          {{/ repeat }}\n        ]\n      },\n    {{/ repeat }}\n  ],\n  "total": "{{queryParam \'total\' \'10\'}}"\n}'
          }
        ]
      },
      {
        ...newRoutes[3],
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
                invert: false,
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
                invert: false,
                operator: 'regex'
              }
            ]
          }
        ]
      },
      {
        ...newRoutes[4],
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
        ...newRoutes[5],
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
        ...newRoutes[6],
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
    ],
    rootChildren: newRoutes.map((route) => ({
      type: 'route',
      uuid: route.uuid
    }))
  };
};
