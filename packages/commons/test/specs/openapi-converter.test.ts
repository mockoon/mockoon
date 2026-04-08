import { strictEqual } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import { OpenApiConverter } from '../../src';

describe('OpenAPI converter', () => {
  const v3Sample = './test/data/openapi/openapi-v3.yaml';
  const swaggerSample = './test/data/openapi/swagger.json';
  let v3SpecContent: string;
  let swaggerSpecContent: string;

  before(async () => {
    v3SpecContent = await readFile(v3Sample, 'utf8');
    swaggerSpecContent = await readFile(swaggerSample, 'utf8');
  });

  it('should use server url as prefix', async () => {
    const openApiConverter = new OpenApiConverter();
    const environment =
      await openApiConverter.convertFromOpenAPI(v3SpecContent);

    strictEqual(environment?.endpointPrefix, 'prefix');
  });

  it('should return default response if route has no examples (no response added)', async () => {
    const openApiConverter = new OpenApiConverter();
    const environment =
      await openApiConverter.convertFromOpenAPI(v3SpecContent);
    const routeWithoutExample = environment?.routes.find(
      (route) => route.endpoint === 'without-examples'
    );

    strictEqual(routeWithoutExample?.responses.length, 1);
    strictEqual(routeWithoutExample?.responses[0].label, 'Default response');
  });

  it('should add route response from example (Swagger)', async () => {
    const openApiConverter = new OpenApiConverter();
    const environment =
      await openApiConverter.convertFromOpenAPI(swaggerSpecContent);

    const routeWithOneExample = environment?.routes.find(
      (route) => route.endpoint === 'with-one-example'
    );

    strictEqual(routeWithOneExample?.responses.length, 2);
    strictEqual(routeWithOneExample?.responses[1].label, 'Sports');
  });

  it('should add route response from example (OpenAPI v3)', async () => {
    const openApiConverter = new OpenApiConverter();
    const environment =
      await openApiConverter.convertFromOpenAPI(v3SpecContent);
    const routeWithOneExample = environment?.routes.find(
      (route) => route.endpoint === 'with-one-example'
    );

    strictEqual(routeWithOneExample?.responses.length, 2);
    strictEqual(routeWithOneExample?.responses[1].label, 'Sports');
  });

  it('should add multiple route responses from multiple examples', async () => {
    const openApiConverter = new OpenApiConverter();
    const environment =
      await openApiConverter.convertFromOpenAPI(v3SpecContent);
    const routeWithExamples = environment?.routes.find(
      (route) => route.endpoint === 'with-examples'
    );

    strictEqual(routeWithExamples?.responses.length, 3);
    strictEqual(routeWithExamples?.responses[2].label, 'Music');
  });

  it('should add route response with example data', async () => {
    const openApiConverter = new OpenApiConverter();
    const environment =
      await openApiConverter.convertFromOpenAPI(v3SpecContent);
    const routeWithOneExample = environment?.routes.find(
      (route) => route.endpoint === 'with-one-example'
    );
    const expectedBody = `[
  {
    "id": 1,
    "name": "Basketball"
  },
  {
    "id": 2,
    "name": "Volleyball"
  }
]`;

    strictEqual(routeWithOneExample?.responses[1].body, expectedBody);
  });

  it('should keep route response from schema as default', async () => {
    const openApiConverter = new OpenApiConverter();
    const environment =
      await openApiConverter.convertFromOpenAPI(v3SpecContent);
    const routeWithExamples = environment?.routes.find(
      (route) => route.endpoint === 'with-examples'
    );
    const defaultResponse = routeWithExamples?.responses.find(
      (response) => response.label === 'Default response'
    );
    const exampleResponse = routeWithExamples?.responses.find(
      (response) => response.label === 'Music'
    );

    strictEqual(defaultResponse?.default, true);
    strictEqual(exampleResponse?.default, false);
  });

  it('should keep integer enums typed in generated templates', async () => {
    const openApiConverter = new OpenApiConverter();
    const typedEnumSpec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'typed-enums', version: '1.0.0' },
      paths: {
        '/typed-enum': {
          get: {
            responses: {
              200: {
                description: 'ok',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        myIntegerEnum: {
                          type: 'integer',
                          enum: [0, 1, 2, 3]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const environment =
      await openApiConverter.convertFromOpenAPI(typedEnumSpec);
    const route = environment?.routes.find(
      (currentRoute) => currentRoute.endpoint === 'typed-enum'
    );

    strictEqual(
      route?.responses[0].body,
      '{\n  "myIntegerEnum": {{oneOf 0 1 2 3}}\n}'
    );
  });

  it('should keep string enums quoted in generated templates', async () => {
    const openApiConverter = new OpenApiConverter();
    const stringEnumSpec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'string-enums', version: '1.0.0' },
      paths: {
        '/string-enum': {
          get: {
            responses: {
              200: {
                description: 'ok',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        myStringEnum: {
                          type: 'string',
                          enum: ['draft', 'published', 'archived']
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const environment =
      await openApiConverter.convertFromOpenAPI(stringEnumSpec);
    const route = environment?.routes.find(
      (currentRoute) => currentRoute.endpoint === 'string-enum'
    );

    strictEqual(
      route?.responses[0].body,
      "{\n  \"myStringEnum\": \"{{oneOf 'draft' 'published' 'archived'}}\"\n}"
    );
  });

  it('should keep boolean enums unquoted in generated templates', async () => {
    const openApiConverter = new OpenApiConverter();
    const booleanEnumSpec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'boolean-enums', version: '1.0.0' },
      paths: {
        '/boolean-enum': {
          get: {
            responses: {
              200: {
                description: 'ok',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        myBooleanEnum: {
                          type: 'boolean',
                          enum: [true, false]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const environment =
      await openApiConverter.convertFromOpenAPI(booleanEnumSpec);
    const route = environment?.routes.find(
      (currentRoute) => currentRoute.endpoint === 'boolean-enum'
    );

    strictEqual(
      route?.responses[0].body,
      '{\n  "myBooleanEnum": {{oneOf true false}}\n}'
    );
  });

  it('should retain boolean values in example and default', async () => {
    const openApiConverter = new OpenApiConverter();
    const booleanValueSpec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'boolean-value', version: '1.0.0' },
      paths: {
        '/boolean-value': {
          get: {
            responses: {
              200: {
                description: 'ok',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        myFalseDefault: {
                          type: 'boolean',
                          default: false
                        },
                        myTrueDefault: {
                          type: 'boolean',
                          default: true
                        },
                        myFalseExample: {
                          type: 'boolean',
                          example: false
                        },
                        myTrueExample: {
                          type: 'boolean',
                          example: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const environment =
      await openApiConverter.convertFromOpenAPI(booleanValueSpec);
    const route = environment?.routes.find(
      (currentRoute) => currentRoute.endpoint === 'boolean-value'
    );

    const expectedBody = `{
  "myFalseDefault": false,
  "myTrueDefault": true,
  "myFalseExample": false,
  "myTrueExample": true
}`;

    strictEqual(route?.responses[0].body, expectedBody);
  });
});
