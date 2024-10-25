import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { OpenAPIConverter } from '../../../src';

describe('OpenAPI converter', () => {
  it('should use server url as prefix', async () => {
    const openAPIConverter = new OpenAPIConverter();
    const environment = await openAPIConverter.convertFromOpenAPI(
      './test/data/openapi/openapi-v3.yaml'
    );

    strictEqual(environment?.endpointPrefix, 'prefix');
  });

  it('should return default response if route has no examples (no response added)', async () => {
    const openAPIConverter = new OpenAPIConverter();
    const environment = await openAPIConverter.convertFromOpenAPI(
      './test/data/openapi/openapi-v3.yaml'
    );
    const routeWithoutExample = environment?.routes.find(
      (route) => route.endpoint === 'without-examples'
    );

    strictEqual(routeWithoutExample?.responses.length, 1);
    strictEqual(routeWithoutExample?.responses[0].label, 'Default response');
  });

  it('should add route response from example (Swagger)', async () => {
    const openAPIConverter = new OpenAPIConverter();
    const environment = await openAPIConverter.convertFromOpenAPI(
      './test/data/openapi/swagger.json'
    );

    const routeWithOneExample = environment?.routes.find(
      (route) => route.endpoint === 'with-one-example'
    );

    strictEqual(routeWithOneExample?.responses.length, 2);
    strictEqual(routeWithOneExample?.responses[1].label, 'Sports');
  });

  it('should add route response from example (OpenAPI v3)', async () => {
    const openAPIConverter = new OpenAPIConverter();
    const environment = await openAPIConverter.convertFromOpenAPI(
      './test/data/openapi/openapi-v3.yaml'
    );
    const routeWithOneExample = environment?.routes.find(
      (route) => route.endpoint === 'with-one-example'
    );

    strictEqual(routeWithOneExample?.responses.length, 2);
    strictEqual(routeWithOneExample?.responses[1].label, 'Sports');
  });

  it('should add multiple route responses from multiple examples', async () => {
    const openAPIConverter = new OpenAPIConverter();
    const environment = await openAPIConverter.convertFromOpenAPI(
      './test/data/openapi/openapi-v3.yaml'
    );
    const routeWithExamples = environment?.routes.find(
      (route) => route.endpoint === 'with-examples'
    );

    strictEqual(routeWithExamples?.responses.length, 3);
    strictEqual(routeWithExamples?.responses[2].label, 'Music');
  });

  it('should add route response with example data', async () => {
    const openAPIConverter = new OpenAPIConverter();
    const environment = await openAPIConverter.convertFromOpenAPI(
      './test/data/openapi/openapi-v3.yaml'
    );
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
    const openAPIConverter = new OpenAPIConverter();
    const environment = await openAPIConverter.convertFromOpenAPI(
      './test/data/openapi/openapi-v3.yaml'
    );
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
});
