import { expect } from 'chai';
import {OpenAPIConverter} from "../../../src";

describe('OpenAPI converter', () => {
  it('should return default response if route has no examples (no response added)', async () => {
    const openAPIConverter = new OpenAPIConverter();
    const environment = await openAPIConverter.convertFromOpenAPI('./test/data/openapi/openapi-v3.yaml');
    const routeWithoutExample = environment?.routes.find(route => route.endpoint === 'without-examples');

    expect(routeWithoutExample?.responses.length).to.be.equal(1);
    expect(routeWithoutExample?.responses[0].label).to.be.equal('Default response');
  });

  it('should add route response from example (Swagger)', async () => {
    const openAPIConverter = new OpenAPIConverter();
    const environment = await openAPIConverter.convertFromOpenAPI('./test/data/openapi/swagger.json');

    const routeWithOneExample = environment?.routes.find(route => route.endpoint === 'with-one-example');

    expect(routeWithOneExample?.responses.length).to.be.equal(1);
    expect(routeWithOneExample?.responses[0].label).to.be.equal('Sports');
  });

  it('should add route response from example (OpenAPI v3)', async () => {
    const openAPIConverter = new OpenAPIConverter();
    const environment = await openAPIConverter.convertFromOpenAPI('./test/data/openapi/openapi-v3.yaml');
    const routeWithOneExample = environment?.routes.find(route => route.endpoint === 'with-one-example');

    expect(routeWithOneExample?.responses.length).to.be.equal(2);
    expect(routeWithOneExample?.responses[1].label).to.be.equal('Sports');
  });

  it('should add multiple route responses from multiple examples', async () => {
    const openAPIConverter = new OpenAPIConverter();
    const environment = await openAPIConverter.convertFromOpenAPI('./test/data/openapi/openapi-v3.yaml');
    const routeWithExamples = environment?.routes.find(route => route.endpoint === 'with-examples');

    expect(routeWithExamples?.responses.length).to.be.equal(3);
    expect(routeWithExamples?.responses[2].label).to.be.equal('Music');
  });

  it('should add route response with example data', async () => {
    const openAPIConverter = new OpenAPIConverter();
    const environment = await openAPIConverter.convertFromOpenAPI('./test/data/openapi/openapi-v3.yaml');
    const routeWithOneExample = environment?.routes.find(route => route.endpoint === 'with-one-example');
    const expectedBody = `[
  {
    "id": 1,
    "name": "Basketball"
  },
  {
    "id": 2,
    "name": "Volleyball"
  }
]`

    expect(routeWithOneExample?.responses[1].body).to.be.equal(expectedBody);
  });

  it('should keep route response from schema as default', async () => {
    const openAPIConverter = new OpenAPIConverter();
    const environment = await openAPIConverter.convertFromOpenAPI('./test/data/openapi/openapi-v3.yaml');
    const routeWithExamples = environment?.routes.find(route => route.endpoint === 'with-examples');
    const defaultResponse = routeWithExamples?.responses.find(response => response.label === 'Default response');
    const exampleResponse = routeWithExamples?.responses.find(response => response.label === 'Music');

    expect(defaultResponse?.default).to.be.equal(true);
    expect(exampleResponse?.default).to.be.equal(false);
  });

  it('should make route response from example as default if no schema provided', async () => {
    const openAPIConverter = new OpenAPIConverter();
    const environment = await openAPIConverter.convertFromOpenAPI('./test/data/openapi/openapi-v3.yaml');
    const routeWithExamples = environment?.routes.find(route => route.endpoint === 'without-schema');

    expect(routeWithExamples?.responses.length).to.be.equal(1);
    expect(routeWithExamples?.responses[0].label).to.be.equal('Sports');
  });
});
