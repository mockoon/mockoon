import openAPI from '@apidevtools/swagger-parser';
import {
  BodyTypes,
  BuildEnvironment,
  BuildHeader,
  BuildHTTPRoute,
  BuildRouteResponse,
  Environment,
  GetRouteResponseContentType,
  Header,
  INDENT_SIZE,
  Methods,
  RemoveLeadingSlash,
  Route,
  RouteResponse,
  RouteType
} from '@mockoon/commons';
import { OpenAPI, OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { routesFromFolder } from './utils';

type SpecificationVersions = 'SWAGGER' | 'OPENAPI_V3';

/**
 * Convert to and from Swagger/OpenAPI formats
 *
 * OpenAPI specifications: https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.1.md
 * Swagger specifications: https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md
 *
 */
export class OpenAPIConverter {
  /**
   * Import Swagger or OpenAPI format
   *
   * @param filePath
   * @throws {Error}
   */
  public async convertFromOpenAPI(
    filePath: string,
    port?: number
  ): Promise<Environment | null> {
    // .bind() due to https://github.com/APIDevTools/json-schema-ref-parser/issues/139#issuecomment-940500698
    const parsedAPI: OpenAPI.Document = await openAPI.dereference.bind(openAPI)(
      filePath,
      {
        dereference: { circular: 'ignore' }
      }
    );

    if (this.isSwagger(parsedAPI)) {
      return this.convertFromSwagger(parsedAPI, port);
    } else if (this.isOpenAPIV3(parsedAPI)) {
      return this.convertFromOpenAPIV3(parsedAPI, port);
    }

    return null;
  }

  /**
   * Convert environment to OpenAPI JSON object
   *
   *
   * @param environment
   * @throws {Error}
   */
  public async convertToOpenAPIV3(
    environment: Environment,
    prettify = false
  ): Promise<string> {
    const routes = routesFromFolder(
      environment.rootChildren,
      environment.folders,
      environment.routes
    );

    const openAPIEnvironment: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: { title: environment.name, version: '1.0.0' },
      servers: [
        {
          url: `${
            environment.tlsOptions.enabled ? 'https' : 'http'
          }://localhost:${environment.port}/${environment.endpointPrefix}`
        }
      ],
      paths: routes.reduce<OpenAPIV3.PathsObject>((paths, route) => {
        if (route.type !== RouteType.HTTP) {
          return paths;
        }

        const pathParameters = route.endpoint.match(/:[a-zA-Z0-9_]+/g);
        let endpoint = '/' + route.endpoint;

        if (pathParameters && pathParameters.length > 0) {
          endpoint = '/' + route.endpoint.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
        }

        if (!paths[endpoint]) {
          paths[endpoint] = {};
        }

        (paths[endpoint] as OpenAPIV3.OperationObject)[route.method] = {
          description: route.documentation,
          responses: route.responses.reduce<OpenAPIV3.ResponsesObject>(
            (responses, routeResponse) => {
              const responseContentType = GetRouteResponseContentType(
                environment,
                routeResponse
              );

              let responseBody = {};

              // use inline body as an example if it parses correctly (valid JSON no containing templating)
              if (
                routeResponse.bodyType === BodyTypes.INLINE &&
                routeResponse.body
              ) {
                try {
                  JSON.parse(routeResponse.body);
                  responseBody = routeResponse.body;
                } catch (_error) {}
              }

              responses[routeResponse.statusCode.toString()] = {
                description: routeResponse.label,
                content: responseContentType
                  ? { [responseContentType]: { example: responseBody } }
                  : { '*/*': { example: responseBody } },
                headers: [
                  ...environment.headers,
                  ...routeResponse.headers
                ].reduce<Record<string, OpenAPIV3.HeaderObject>>(
                  (headers, header) => {
                    if (header.key.toLowerCase() !== 'content-type') {
                      headers[header.key] = {
                        schema: { type: 'string' },
                        example: header.value
                      };
                    }

                    return headers;
                  },
                  {}
                )
              } as any;

              return responses;
            },
            {}
          )
        };

        if (pathParameters && pathParameters.length > 0) {
          (
            (paths[endpoint] as OpenAPIV3.OperationObject)[
              route.method
            ] as OpenAPIV3.OperationObject
          ).parameters = pathParameters.reduce<OpenAPIV3.ParameterObject[]>(
            (parameters, parameter) => {
              parameters.push({
                name: parameter.slice(1, parameter.length),
                in: 'path',
                schema: { type: 'string' },
                required: true
              });

              return parameters;
            },
            []
          );
        }

        return paths;
      }, {})
    };

    await openAPI.validate(openAPIEnvironment);

    return JSON.stringify(openAPIEnvironment, null, prettify ? 2 : 0);
  }

  /**
   * Convert Swagger 2.0 format
   *
   * @param parsedAPI
   */
  private convertFromSwagger(
    parsedAPI: OpenAPIV2.Document,
    port?: number
  ): Environment {
    const newEnvironment = BuildEnvironment({
      hasDefaultHeader: false,
      hasDefaultRoute: false,
      port
    });

    // parse the port
    newEnvironment.port =
      (parsedAPI.host && parseInt(parsedAPI.host.split(':')[1], 10)) ||
      newEnvironment.port;

    if (parsedAPI.basePath) {
      newEnvironment.endpointPrefix = RemoveLeadingSlash(parsedAPI.basePath);
    }

    newEnvironment.name = parsedAPI.info.title || 'Swagger import';

    newEnvironment.routes = this.createRoutes(parsedAPI, 'SWAGGER');

    newEnvironment.rootChildren = newEnvironment.routes.map((route) => ({
      type: 'route',
      uuid: route.uuid
    }));

    return newEnvironment;
  }

  /**
   * Convert OpenAPI 3.0 format
   *
   * @param parsedAPI
   */
  private convertFromOpenAPIV3(
    parsedAPI: OpenAPIV3.Document,
    port?: number
  ): Environment {
    const newEnvironment = BuildEnvironment({
      hasDefaultHeader: false,
      hasDefaultRoute: false,
      port
    });

    const server: OpenAPIV3.ServerObject[] | undefined = parsedAPI.servers;

    if (server?.[0]?.url) {
      const url = this.v3ParametersReplace(server[0].url, server[0].variables);

      if (url.startsWith('/')) {
        newEnvironment.endpointPrefix = RemoveLeadingSlash(url);
      } else {
        try {
          const parsedUrl = new URL(url);
          newEnvironment.endpointPrefix = RemoveLeadingSlash(
            parsedUrl.pathname
          );
        } catch (_error) {
          // fail silently
        }
      }
    }

    newEnvironment.name = parsedAPI.info.title || 'OpenAPI import';

    newEnvironment.routes = this.createRoutes(parsedAPI, 'OPENAPI_V3');

    newEnvironment.rootChildren = newEnvironment.routes.map((route) => ({
      type: 'route',
      uuid: route.uuid
    }));

    return newEnvironment;
  }

  /**
   * Creates routes from imported swagger/OpenAPI document
   *
   * @param parsedAPI
   * @param version
   */
  private createRoutes(
    parsedAPI: OpenAPIV2.Document,
    version: 'SWAGGER'
  ): Route[];
  private createRoutes(
    parsedAPI: OpenAPIV3.Document,
    version: 'OPENAPI_V3'
  ): Route[];
  private createRoutes(
    parsedAPI: OpenAPIV2.Document & OpenAPIV3.Document,
    version: SpecificationVersions
  ): Route[] {
    const routes: Route[] = [];

    Object.keys(parsedAPI.paths).forEach((routePath) => {
      Object.keys(parsedAPI.paths[routePath]).forEach((routeMethod) => {
        const parsedRoute: OpenAPIV2.OperationObject &
          OpenAPIV3.OperationObject = parsedAPI.paths[routePath][routeMethod];

        if (routeMethod in Methods) {
          const routeResponses: RouteResponse[] = [];

          Object.keys(parsedRoute.responses).forEach((responseStatus) => {
            const statusCode = parseInt(responseStatus, 10);
            // filter unsupported status codes (i.e. ranges containing "X", 4XX, 5XX, etc)
            // consider 'default' as 200
            if (
              (statusCode >= 100 && statusCode <= 999) ||
              responseStatus === 'default'
            ) {
              const routeResponse: OpenAPIV2.ResponseObject &
                OpenAPIV3.ResponseObject = parsedRoute.responses[
                responseStatus
              ] as OpenAPIV2.ResponseObject & OpenAPIV3.ResponseObject;

              let contentTypeHeaders: string[] = [];
              let schema:
                | OpenAPIV2.SchemaObject
                | OpenAPIV3.SchemaObject
                | undefined;
              let examples:
                | OpenAPIV2.ExampleObject
                | OpenAPIV3.ExampleObject
                | undefined;

              if (version === 'SWAGGER') {
                contentTypeHeaders =
                  parsedRoute.produces ??
                  parsedRoute.consumes ??
                  parsedAPI.produces ??
                  parsedAPI.consumes ??
                  [];
              } else if (version === 'OPENAPI_V3' && routeResponse.content) {
                contentTypeHeaders = Object.keys(routeResponse.content);
              }

              // extract schema
              const contentTypeHeader = contentTypeHeaders.find((header) =>
                header.includes('application/json')
              );

              if (contentTypeHeader) {
                if (version === 'SWAGGER') {
                  schema = routeResponse.schema;
                  examples = routeResponse.examples;
                } else if (version === 'OPENAPI_V3') {
                  schema = routeResponse.content?.[contentTypeHeader].schema;
                  examples =
                    routeResponse.content?.[contentTypeHeader].examples;
                }
              }

              const headers = this.buildResponseHeaders(
                contentTypeHeaders,
                routeResponse.headers
              );

              routeResponses.push(
                this.buildResponse(
                  schema ? this.generateSchema(schema) : undefined,
                  routeResponse.description || '',
                  responseStatus === 'default' ? 200 : statusCode,
                  headers
                )
              );

              // add response based on examples
              if (examples) {
                const routeResponseExamples = this.parseOpenAPIExamples(
                  examples,
                  version
                ).map((example) =>
                  this.buildResponse(
                    example.body,
                    example.label,
                    responseStatus === 'default' ? 200 : statusCode,
                    headers
                  )
                );
                routeResponses.push(...routeResponseExamples);
              }
            }
          });

          // check if has at least one response
          if (!routeResponses.length) {
            routeResponses.push({
              ...BuildRouteResponse(),
              headers: [BuildHeader('Content-Type', 'application/json')],
              body: ''
            });
          }

          // mark the first route response as default
          routeResponses[0].default = true;

          const newRoute: Route = {
            ...BuildHTTPRoute(false),
            documentation: parsedRoute.summary || parsedRoute.description || '',
            method: routeMethod as Methods,
            endpoint: RemoveLeadingSlash(this.v2ParametersReplace(routePath)),
            responses: routeResponses
          };

          routes.push(newRoute);
        }
      });
    });

    return routes;
  }

  /**
   * Build route response headers from 'content' (v3) or 'produces' (v2), and 'headers' objects
   *
   * @param contentTypes
   * @param responseHeaders
   */
  private buildResponseHeaders(
    contentTypes: string[],
    responseHeaders:
      | undefined
      | OpenAPIV2.HeadersObject
      | Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject>
  ): Header[] {
    const routeContentTypeHeader = BuildHeader(
      'Content-Type',
      'application/json'
    );

    if (contentTypes?.length && !contentTypes.includes('application/json')) {
      routeContentTypeHeader.value = contentTypes[0];
    }

    if (responseHeaders != null) {
      return [
        routeContentTypeHeader,
        ...Object.keys(responseHeaders).map((headerName) => {
          let headerValue = '';

          if (responseHeaders[headerName] != null) {
            if (responseHeaders[headerName]['example'] != null) {
              headerValue = responseHeaders[headerName]['example'];
            } else if (responseHeaders[headerName]['examples'] != null) {
              headerValue =
                responseHeaders[headerName]['examples'][
                  Object.keys(responseHeaders[headerName]['examples'])[0]
                ]['value'];
            } else if (responseHeaders[headerName]['schema'] != null) {
              headerValue = this.generateSchema(
                responseHeaders[headerName]['schema']
              );
            }
          }

          return BuildHeader(headerName, headerValue);
        })
      ];
    }

    return [routeContentTypeHeader];
  }

  /**
   * Build route response from label, status code, headers and unformatted body.
   * @param body
   * @param label
   * @param statusCode
   * @param headers
   * @private
   */
  private buildResponse(
    body: object | undefined,
    label: string,
    statusCode: number,
    headers: Header[]
  ) {
    return {
      ...BuildRouteResponse(),
      body:
        body !== undefined
          ? this.convertJSONSchemaPrimitives(
              JSON.stringify(body, null, INDENT_SIZE)
            )
          : '',
      label,
      statusCode,
      headers
    };
  }

  /**
   * Replace parameters in `str`
   *
   * @param str
   */
  private v2ParametersReplace(str: string) {
    return str.replace(
      /{(\w+)}/gi,
      (searchValue, replaceValue) => ':' + replaceValue
    );
  }

  /**
   * Replace parameters in `str` with server variables
   *
   * @param str
   * @param parameters
   * @returns
   */
  private v3ParametersReplace(
    str: string,
    parameters: Record<string, OpenAPIV3.ServerVariableObject> | undefined
  ) {
    return str.replace(/{(\w+)}/gi, (searchValue, replaceValue) =>
      parameters ? parameters[replaceValue].default : ''
    );
  }

  /**
   * Swagger specification type guard
   *
   * @param parsedAPI
   */
  private isSwagger(parsedAPI: any): parsedAPI is OpenAPIV2.Document {
    return parsedAPI.swagger !== undefined;
  }

  /**
   * OpenAPI v3 specification type guard
   *
   * @param parsedAPI
   */
  private isOpenAPIV3(parsedAPI: any): parsedAPI is OpenAPIV3.Document {
    return (
      parsedAPI.openapi !== undefined && parsedAPI.openapi.startsWith('3.')
    );
  }

  /**
   * Generate a JSON object from a schema
   *
   */
  private generateSchema(
    schema: OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject
  ) {
    const typeFactories = {
      integer: () => "{{faker 'number.int' max=99999}}",
      number: () => "{{faker 'number.int' max=99999}}",
      number_float: () => "{{faker 'number.float'}}",
      number_double: () => "{{faker 'number.float'}}",
      string: () => '',
      string_date: () => "{{date '2019' (now) 'yyyy-MM-dd'}}",
      'string_date-time': () => "{{faker 'date.recent' 365}}",
      string_email: () => "{{faker 'internet.email'}}",
      string_uuid: () => "{{faker 'string.uuid'}}",
      boolean: () => "{{faker 'datatype.boolean'}}",
      array: (arraySchema) => {
        const newObject = this.generateSchema(arraySchema.items);

        return arraySchema.collectionFormat === 'csv' ? newObject : [newObject];
      },
      object: (objectSchema) => {
        const newObject = {};
        const { properties } = objectSchema;

        if (properties) {
          Object.keys(properties).forEach((propertyName) => {
            newObject[propertyName] = this.generateSchema(
              properties[propertyName]
            );
          });
        }

        return newObject;
      }
    };

    if (schema instanceof Object) {
      let type: string =
        Array.isArray(schema.type) && schema.type.length >= 1
          ? schema.type[0]
          : (schema.type as string);

      // use enum property if present
      if (schema.enum) {
        return `{{oneOf (array '${schema.enum.join("' '")}')}}`;
      }

      // return example if any
      if (schema.example) {
        return schema.example;
      }

      // return default value if any
      if (schema.default) {
        return schema.default;
      }

      const schemaToBuild = schema;

      // check if we have an array of schemas, and take first item
      for (const propertyName of ['allOf', 'oneOf', 'anyOf']) {
        if (
          Object.prototype.hasOwnProperty.call(schema, propertyName) &&
          schema[propertyName].length > 0
        ) {
          return this.generateSchema(schema[propertyName][0]);
        }
      }

      // sometimes we have no type but only 'properties' (=object)
      if (
        !type &&
        schemaToBuild.properties &&
        schemaToBuild.properties instanceof Object
      ) {
        type = 'object';
      }

      const typeFactory =
        typeFactories[`${type}_${schemaToBuild.format}`] || typeFactories[type];

      if (typeFactory) {
        return typeFactory(schemaToBuild);
      }

      return '';
    }
  }

  /**
   * After generating example bodies, remove the quotes around some
   * primitive helpers
   *
   * @param jsonSchema
   */
  private convertJSONSchemaPrimitives(jsonSchema: string) {
    return jsonSchema.replace(
      /"({{faker '(?:number\.int|number\.float|datatype\.boolean)'(?: max=99999)?}})"/g,
      '$1'
    );
  }

  /**
   * Extract bodies and labels from OpenAPI examples
   * @param examples
   * @param version
   * @private
   */
  private parseOpenAPIExamples(
    examples: OpenAPIV2.ExampleObject | OpenAPIV3.ExampleObject,
    version: string
  ) {
    const responses: { label: string; body: any }[] = [];

    Object.keys(examples).forEach((exampleName) => {
      const example = examples[exampleName];
      const exampleBody = version === 'SWAGGER' ? example : example.value;

      const exampleResponse = {
        body: exampleBody,
        label: exampleName
      };

      responses.push(exampleResponse);
    });

    return responses;
  }
}
