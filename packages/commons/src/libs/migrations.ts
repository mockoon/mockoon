import { v4 as uuid } from 'uuid';
import {
  EnvironmentDefault,
  ResponseRuleDefault,
  RouteResponseDefault
} from '../constants/environment-schema.constants';
import { Environment } from '../models/environment.model';
import {
  Header,
  ResponseMode,
  ResponseRule,
  Route,
  RouteResponse
} from '../models/route.model';

/**
 * Old types use for compatibility purposes
 */

// old routes with file
type RouteWithFile = Route & { file: any };

// old route when route responses didn't exists
type RouteAsResponse = Route & {
  body?: string;
  statusCode?: string;
  headers?: Header[];
  latency?: number;
  filePath?: string;
  sendFileAsBody?: boolean;
};

// old route response with status code as string
type RouteResponseWithStringStatus = RouteResponse | { statusCode: string };

// old environment with https property
type EnvironmentWithHttps = Environment & { https: boolean };

// old routes with sequential and random responses
type RouteWithResponseModes = Route & {
  sequentialResponse: boolean;
  randomResponse: boolean;
};

/**
 * List of migration functions.
 *
 * Will determine import compatibility:
 * lastMigration < HighestMigrationId -> migrate
 * lastMigration > HighestMigrationId -> error
 */
export const Migrations: {
  id: number;
  migrationFunction: (environment: Environment) => void;
}[] = [
  // v0.4.0beta
  {
    id: 1,
    migrationFunction: (environment: Environment) => {
      // proxy settings
      if (!environment.proxyMode) {
        environment.proxyMode = false;
      }
      if (!environment.proxyHost) {
        environment.proxyHost = '';
      }
      if (!(environment as EnvironmentWithHttps).https) {
        (environment as EnvironmentWithHttps).https = false;
      }
    }
  },

  // 1.0.0
  {
    id: 2,
    migrationFunction: (environment: Environment) => {
      if (!environment.cors) {
        environment.cors = true;
      }

      environment.routes.forEach((route) => {
        // add uuid
        if (!route.uuid) {
          route.uuid = uuid();
        }

        if (route['customHeaders']) {
          // find content type header
          const ContentTypeHeader = route['customHeaders'].find(
            (customHeader) => customHeader.key === 'Content-Type'
          );

          // add custom header only if no content type
          if (!ContentTypeHeader) {
            route['customHeaders'].unshift({
              uuid: uuid(),
              key: 'Content-Type',
              value: route['contentType']
            });
          }

          // delete old content type
          delete route['contentType'];
        }
      });
    }
  },

  // 1.2.0
  {
    id: 3,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route) => {
        // add missing uuid
        if (!route.uuid) {
          route.uuid = uuid();
        }
      });
    }
  },

  // 1.3.0
  {
    id: 4,
    migrationFunction: (environment: Environment) => {
      // add new headers property to environments
      if (!environment.headers) {
        (environment.headers as any) = [{ uuid: uuid(), key: '', value: '' }];
      }

      (environment.routes as RouteWithFile[]).forEach((route) => {
        // add missing sendAsBody
        if (route.file && route.file.sendAsBody === undefined) {
          route.file.sendAsBody = false;
        }

        // add missing documentation
        if (route.documentation === undefined) {
          route.documentation = '';
        }

        // rename customHeaders to headers
        if (route['customHeaders']) {
          route['headers'] = route['customHeaders'];
          delete route['customHeaders'];
        }
      });
    }
  },

  // 1.4.0
  {
    id: 5,
    migrationFunction: (environment: Environment) => {
      delete environment['duplicates'];

      (environment.routes as RouteWithFile[]).forEach((route) => {
        // remove file object
        route['filePath'] = route.file ? route.file.path : '';
        route['sendFileAsBody'] = route.file ? route.file.sendAsBody : false;
        delete route.file;

        delete route['duplicates'];
      });
    }
  },

  /**
   * Multiple route responses:
   * Create a responses object in each route and migrate the old route properties in the new route response
   */
  {
    id: 6,
    migrationFunction: (environment: Environment) => {
      (environment.routes as RouteAsResponse[]).forEach((route) => {
        route.responses = [];
        (route.responses as RouteResponseWithStringStatus[]).push({
          uuid: uuid(),
          statusCode: route.statusCode as string,
          label: '',
          latency: route.latency,
          filePath: route.filePath,
          sendFileAsBody: route.sendFileAsBody,
          headers: route.headers,
          body: route.body,
          rules: []
        });

        delete route.statusCode;
        delete route.latency;
        delete route.filePath;
        delete route.sendFileAsBody;
        delete route.headers;
        delete route.body;
      });
    }
  },

  /**
   * Renew route responses UUID to ensure no uuid were duplicated after v1.5.0
   */
  {
    id: 7,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.responses.forEach((routeResponse) => {
          routeResponse.uuid = uuid();
        });
      });
    }
  },

  /**
   * Create a "enabled" param
   */
  {
    id: 8,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.enabled = true;
      });
    }
  },

  /**
   * Add route response label
   */
  {
    id: 9,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.responses.forEach((routeResponse) => {
          if (!routeResponse.label) {
            routeResponse.label = '';
          }
        });
      });
    }
  },

  /**
   * Add proxy request/response headers
   */
  {
    id: 10,
    migrationFunction: (environment: Environment) => {
      // add new proxy request/response headers property to environments
      if (!environment.proxyReqHeaders) {
        environment.proxyReqHeaders = [{ key: '', value: '' }];
      }
      if (!environment.proxyResHeaders) {
        environment.proxyResHeaders = [{ key: '', value: '' }];
      }
    }
  },

  /**
   * Add route response's disableTemplating option.
   * Convert statusCode to number
   */
  {
    id: 11,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.responses.forEach((routeResponse) => {
          if (routeResponse.disableTemplating === undefined) {
            routeResponse.disableTemplating = false;
          }

          routeResponse.statusCode = parseInt(
            routeResponse.statusCode as unknown as string,
            10
          );
        });
      });
    }
  },

  /**
   * Add route response rulesOperator
   */
  {
    id: 12,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.responses.forEach((routeResponse) => {
          if (routeResponse.rulesOperator === undefined) {
            routeResponse.rulesOperator = 'OR';
          }
        });
      });
    }
  },

  /**
   * Add route randomResponse param
   */
  {
    id: 13,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route) => {
        if ((route as RouteWithResponseModes).randomResponse === undefined) {
          (route as RouteWithResponseModes).randomResponse = false;
        }
      });
    }
  },

  /**
   * Add route sequentialResponse param
   */
  {
    id: 14,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        if (
          (route as RouteWithResponseModes).sequentialResponse === undefined
        ) {
          (route as RouteWithResponseModes).sequentialResponse = false;
        }
      });
    }
  },

  /**
   * Add proxyRemovePrefix param
   */
  {
    id: 15,
    migrationFunction: (environment: Environment) => {
      if (environment.proxyRemovePrefix === undefined) {
        environment.proxyRemovePrefix = false;
      }
    }
  },

  /**
   * Add hostname
   */
  {
    id: 16,
    migrationFunction: (environment: Environment) => {
      if (!environment.hostname) {
        environment.hostname = '0.0.0.0';
      }
    }
  },
  /**
   * Add route response's fallbackTo404 option.
   */
  {
    id: 17,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.responses.forEach((routeResponse) => {
          if (routeResponse.fallbackTo404 === undefined) {
            routeResponse.fallbackTo404 = false;
          }
        });
      });
    }
  },
  /**
   * Replaced isRegex in Response Rules for operator field.
   */
  {
    id: 18,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.responses.forEach((routeResponse) => {
          (
            routeResponse.rules as Array<ResponseRule & { isRegex?: boolean }>
          ).forEach((rule) => {
            if (rule.isRegex) {
              rule.operator = 'regex';
            }
            if (rule.operator === undefined) {
              rule.operator = ResponseRuleDefault.operator;
            }
            delete rule.isRegex;
          });
        });
      });
    }
  },
  /**
   * Replaced https by tlsOptions object.
   */
  {
    id: 19,
    migrationFunction: (environment: Environment) => {
      if (!environment.tlsOptions) {
        environment.tlsOptions = {
          enabled: (environment as EnvironmentWithHttps).https,
          type: EnvironmentDefault.tlsOptions.type,
          pfxPath: EnvironmentDefault.tlsOptions.pfxPath,
          certPath: EnvironmentDefault.tlsOptions.certPath,
          keyPath: EnvironmentDefault.tlsOptions.keyPath,
          caPath: EnvironmentDefault.tlsOptions.caPath,
          passphrase: EnvironmentDefault.tlsOptions.passphrase
        };
      }

      delete environment['https'];
    }
  },
  /**
   * Add route response `default` property
   */
  {
    id: 20,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.responses.forEach((routeResponse, routeResponseIndex) => {
          if (routeResponse.default === undefined) {
            if (routeResponseIndex === 0) {
              routeResponse.default = true;
            } else {
              routeResponse.default = RouteResponseDefault.default;
            }
          }
        });
      });
    }
  },
  /**
   * Remove route sequential and random response, and add responseMode
   */
  {
    id: 21,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        if (route.responseMode === undefined) {
          route.responseMode = (route as RouteWithResponseModes)
            .sequentialResponse
            ? ResponseMode.SEQUENTIAL
            : (route as RouteWithResponseModes).randomResponse
            ? ResponseMode.RANDOM
            : null;
        }

        delete route['sequentialResponse'];
        delete route['randomResponse'];
      });
    }
  },
  /**
   * Add invert property to the rules
   */
  {
    id: 22,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.responses.forEach((routeResponse) => {
          routeResponse.rules.forEach((rule) => {
            if (rule.invert === undefined) {
              rule.invert = ResponseRuleDefault.invert;
            }
          });
        });
      });
    }
  },
  /**
   * Add graphql properties
   */
  {
    id: 23,
    migrationFunction: (environment: Environment) => {
      environment.routes.forEach((route: Route) => {
        route.responses.forEach((routeResponse) => {
          if (routeResponse.graphQLSchema === undefined) {
            routeResponse.graphQLSchema = RouteResponseDefault.graphQLSchema;
          }
        });
      });
    }
  }
];

export const HighestMigrationId = Migrations[Migrations.length - 1].id;
