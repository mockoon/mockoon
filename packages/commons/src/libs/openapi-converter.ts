import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { INDENT_SIZE } from '../constants/common.constants';
import { Environment } from '../models/environment.model';
import {
  BodyTypes,
  Header,
  Methods,
  Route,
  RouteResponse,
  RouteType
} from '../models/route.model';
import {
  crudRoutesBuilder,
  GetRouteResponseContentType,
  RemoveLeadingSlash,
  routesFromFolder
} from '../utils/utils';
import {
  BuildEnvironment,
  BuildHeader,
  BuildHTTPRoute,
  BuildRouteResponse
} from './schema-builder';

/**
 * Convert to and from Swagger/OpenAPI formats
 *
 * OpenAPI specifications: https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.1.md
 * Swagger specifications: https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md
 *
 */
export class OpenApiConverter {
  /**
   * Import Swagger or OpenAPI format
   * Receives a raw specification string and tries to parse it
   * Loading of the file or URL should be done by the caller even if scalar/openapi-parser
   * can also load files and URLs.
   * $ref URLs will be fetched.
   * File loading is not done here to keep this library compatible with browser usage.
   *
   * @param spec - raw specification string
   * @throws {Error}
   */
  public async convertFromOpenAPI(
    spec: string,
    port?: number
  ): Promise<Environment | null> {
    const parsedSpec = this.parseJsonOrYaml(spec);
    const schema = await this.dereference(parsedSpec);

    if (this.isSwagger(schema)) {
      return this.convertFromSwagger(schema, port);
    } else if (this.isOpenAPIV3(schema)) {
      return this.convertFromOpenAPIV3(schema, port);
    }

    throw new Error('Not a valid Swagger/OpenAPI specification');
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
    format: 'json' | 'yaml',
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
        let subRoutes: Route[];

        if (route.type === RouteType.HTTP) {
          subRoutes = [route];
        } else if (route.type === RouteType.CRUD) {
          // create all the CRUD routes for this endpoint
          const crudRoutes = crudRoutesBuilder(route.endpoint);

          subRoutes = crudRoutes.map((crudRoute) => {
            return {
              ...{
                ...route,
                responses: [
                  {
                    ...route.responses[0],
                    statusCode: crudRoute.defaultStatus
                  }
                ],
                documentation: crudRoute.docs
              },
              method: crudRoute.method as Methods,
              endpoint: crudRoute.path
            };
          });
        } else {
          return paths;
        }

        subRoutes.forEach((subRoute) => {
          const pathParameters = subRoute.endpoint.match(/:[a-zA-Z0-9_]+/g);
          let endpoint = '/' + subRoute.endpoint;

          if (pathParameters && pathParameters.length > 0) {
            endpoint =
              '/' + subRoute.endpoint.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
          }

          if (!paths[endpoint]) {
            paths[endpoint] = {};
          }

          (paths[endpoint] as OpenAPIV3.OperationObject)[subRoute.method] = {
            description: subRoute.documentation,
            responses: subRoute.responses.reduce<OpenAPIV3.ResponsesObject>(
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
                subRoute.method
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
        });

        return paths;
      }, {})
    };

    return format === 'json'
      ? JSON.stringify(openAPIEnvironment, null, prettify ? 2 : 0)
      : yamlStringify(openAPIEnvironment);
  }

  /**
   * Dereference all $ref in an OpenAPI specification
   * Handles both internal (#/components/schemas/...) and external (URL) references
   * Includes circular dependency detection and caching
   *
   * @param parsedSpec - The parsed OpenAPI specification
   * @returns Promise<any> - The dereferenced schema
   */
  public async dereference(parsedSpec: any): Promise<any> {
    const externalCache = new Map<string, any>();
    const internalCache = new Map<string, any>();
    const dereferenceCache = new Map<string, any>();
    const visitedNodes = new Set<any>();
    const circularRefs = new Set<string>();
    const rootSchema = parsedSpec;

    /**
     * Fetch and parse external reference
     *
     * @throws {Error} - If fetching or parsing fails
     */
    const fetchExternalRef = async (url: string): Promise<any> => {
      if (externalCache.has(url)) {
        return externalCache.get(url);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${url}: ${response.status} ${response.statusText}`
        );
      }

      const content = await response.text();
      const parsed = this.parseJsonOrYaml(content);
      externalCache.set(url, parsed);

      return parsed;
    };

    const resolveRef = (schema: any, fragment: string) => {
      fragment = fragment.replace(/^#/, '');

      const fragmentPath = fragment.startsWith('/')
        ? fragment.slice(1).split('/')
        : fragment.split('/');
      let current = schema;

      for (const segment of fragmentPath) {
        // invalid fragment path
        if (!current || typeof current !== 'object') {
          return null;
        }

        current = current[segment];

        // fragment not found
        if (current === undefined) {
          return null;
        }
      }

      return current;
    };

    const processRef = async (refPath: string) => {
      if (refPath.startsWith('http://') || refPath.startsWith('https://')) {
        // External URL reference
        const [url, fragment] = refPath.split('#');
        const externalSchema = await fetchExternalRef(url);

        if (!externalSchema) {
          return null;
        }

        if (fragment) {
          return resolveRef(externalSchema, fragment);
        }

        return externalSchema;
      } else if (refPath.startsWith('#/')) {
        // Internal reference
        if (internalCache.has(refPath)) {
          return internalCache.get(refPath);
        }

        const current: any = resolveRef(rootSchema, refPath);

        internalCache.set(refPath, current);

        return current;
      }
    };

    /**
     * Recursively traverse and dereference the schema
     */
    const crawl = async (current: any, path = '#'): Promise<any> => {
      if (current === null || typeof current !== 'object') {
        return current;
      }

      // Avoid infinite loops with circular references in object structure
      if (visitedNodes.has(current)) {
        return current;
      }

      if (Array.isArray(current)) {
        const result: any[] = [];
        for (let i = 0; i < current.length; i++) {
          result[i] = await crawl(current[i], `${path}/${i}`);
        }

        return result;
      }

      // Handle $ref
      if (current.$ref && typeof current.$ref === 'string') {
        const refPath = current.$ref;

        // Check if we already dereferenced this exact ref - if so, return cached result
        if (dereferenceCache.has(refPath)) {
          return dereferenceCache.get(refPath);
        }

        /**
         * Check for circular reference before processing
         * Returns an empty object that will be converted in a simple string in generateSchema()
         */
        if (circularRefs.has(refPath)) {
          return {};
        }

        const resolvedRef = await processRef(refPath);

        if (resolvedRef) {
          // Add to circular reference tracking before recursing
          circularRefs.add(refPath);
          // Recursively dereference the resolved schema
          const result = await crawl(resolvedRef, refPath);
          // Remove from circular reference tracking after processing
          circularRefs.delete(refPath);

          // Cache the dereferenced result
          dereferenceCache.set(refPath, result);

          return result;
        } else {
          // Return original $ref if resolution failed
          return current;
        }
      }

      visitedNodes.add(current);

      const result: any = {};

      for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
          const res = await crawl(current[key], `${path}/${key}`);
          result[key] = res;
        }
      }

      visitedNodes.delete(current);

      return result;
    };

    return await crawl(rootSchema);
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
      hasContentTypeHeader: false,
      hasCorsHeaders: true,
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
      hasContentTypeHeader: false,
      hasCorsHeaders: true,
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
    version: 'SWAGGER' | 'OPENAPI_V3'
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
            endpoint: RemoveLeadingSlash(
              this.routeParametersReplace(routePath)
            ),
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
   * Replace parameters in `str`:
   * - {parameter-name} => :parametername (Express does
   * not support hyphens in parameter names)
   * - {param} => :param
   *
   * @param str
   */
  private routeParametersReplace(str: string) {
    return str.replace(
      /{([-\w]+)}/gi,
      (searchValue, replaceValue) => ':' + replaceValue.replaceAll('-', '')
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
   * Merge multiple schemas from allOf into a single schema
   * Combines properties, required fields, and other schema attributes
   *
   * @param schemas - Array of schemas to merge
   * @returns Merged schema
   */
  private mergeAllOfSchemas(
    schemas: (OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject)[]
  ): OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject {
    const mergedSchema: any = {
      type: 'object',
      properties: {},
      required: []
    };

    schemas.forEach((subSchema) => {
      const typedSchema = subSchema as any;

      // Merge properties
      if (typedSchema.properties) {
        mergedSchema.properties = {
          ...mergedSchema.properties,
          ...typedSchema.properties
        };
      }

      // Merge required fields
      if (typedSchema.required && Array.isArray(typedSchema.required)) {
        mergedSchema.required = [
          ...new Set([...mergedSchema.required, ...typedSchema.required])
        ];
      }

      // Merge examples from all schemas
      if (typedSchema.example) {
        if (!mergedSchema.example) {
          mergedSchema.example = {};
        }

        mergedSchema.example = {
          ...mergedSchema.example,
          ...typedSchema.example
        };
      }

      // Take first default if present
      if (
        typedSchema.default !== undefined &&
        mergedSchema.default === undefined
      ) {
        mergedSchema.default = typedSchema.default;
      }

      // Merge enum values
      if (typedSchema.enum) {
        if (!mergedSchema.enum) {
          mergedSchema.enum = [...typedSchema.enum];
        } else {
          mergedSchema.enum = [
            ...new Set([...mergedSchema.enum, ...typedSchema.enum])
          ];
        }
      }
    });

    // Clean up empty required array
    if (mergedSchema.required.length === 0) {
      delete mergedSchema.required;
    }

    return mergedSchema;
  }

  /**
   * Generate a JSON object from a schema
   *
   * @scalar/openapi-parser handles circular references differently than the previous
   * library we used (@apidevtools/swagger-parser)
   * Instead of ignoring them, it reuses the object references and creates
   * circular structures in the parsed object.
   *
   * We need to keep track of the schemas we've already parsed in `parentSchemas`
   * but delete them when going out of a branch (i.e. when going to the next sibling).
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

      // handle schema composition keywords
      if (schema.allOf && schema.allOf.length > 0) {
        // allOf: merge all schemas together, then generate from the merged schema
        const mergedSchema = this.mergeAllOfSchemas(
          schema.allOf as (OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject)[]
        );

        return this.generateSchema(mergedSchema);
      }

      if (schema.oneOf && schema.oneOf.length > 0) {
        // oneOf: exactly one schema should match - take first as example
        return this.generateSchema(
          schema.oneOf[0] as OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject
        );
      }

      if (schema.anyOf && schema.anyOf.length > 0) {
        // anyOf: one or more schemas should match - take first as example
        return this.generateSchema(
          schema.anyOf[0] as OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject
        );
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
   * Parses a JSON or YAML specification string.
   *
   * @param spec - raw specification string
   * @returns
   */
  private parseJsonOrYaml(spec: string) {
    let parsedSpec: any;

    try {
      parsedSpec = JSON.parse(spec);
    } catch (jsonError: unknown) {
      try {
        parsedSpec = yamlParse(spec);
      } catch (yamlError: unknown) {
        throw new Error(
          `Invalid JSON or YAML format: ${jsonError ? (jsonError as Error).message : ''} ${yamlError ? (yamlError as Error).message : ''}`
        );
      }
    }

    return parsedSpec;
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
