import { test } from '@oclif/test';
import axios from 'axios';
import { expect } from 'chai';
import { stopProcesses } from '../libs/helpers';

describe('Run OpenAPI spec (YAML)', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/openapi/petstore.yaml'])
    .it('should start mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-swagger-petstore)'
      );
    });

  test.it('should call GET /v1/pets endpoint and get a result', async () => {
    const result = await axios.get('http://localhost:3000/v1/pets');

    expect(result.data[0].id).to.not.equal(undefined);
  });

  stopProcesses('all', ['mockoon-swagger-petstore']);
});

describe('Run OpenAPI spec (JSON)', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/openapi/petstore.json'])
    .it('should start mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-swagger-petstore)'
      );
    });

  test.it('should call GET /v1/pets endpoint and get a result', async () => {
    const result = await axios.get('http://localhost:3000/v1/pets');

    expect(result.data[0].id).to.not.equal(undefined);
  });

  stopProcesses('all', ['mockoon-swagger-petstore']);
});

describe('Run OpenAPI spec from URL (JSON)', () => {
  test
    .stdout()
    .command([
      'start',
      '--data',
      'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml'
    ])
    .it('should start mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-swagger-petstore)'
      );
    });

  test.it('should call GET /v1/pets endpoint and get a result', async () => {
    const result = await axios.get('http://localhost:3000/v1/pets');

    expect(result.data[0].id).to.not.equal(undefined);
  });

  stopProcesses('all', ['mockoon-swagger-petstore']);
});
