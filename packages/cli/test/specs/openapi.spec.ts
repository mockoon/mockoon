import { test } from '@oclif/test';
import axios from 'axios';
import { expect } from 'chai';

describe('Run OpenAPI spec (YAML)', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/openapi/petstore.yaml'])
    .do(async () => {
      const result = await axios.get('http://localhost:3000/v1/pets');

      expect(result.data[0].id).to.not.equal(undefined);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /v1/pets endpoint and get a result',
      (context) => {
        expect(context.stdout).to.contain('Server started');
      }
    );
});

describe('Run OpenAPI spec (JSON)', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/openapi/petstore.json'])
    .do(async () => {
      const result = await axios.get('http://localhost:3000/v1/pets');

      expect(result.data[0].id).to.not.equal(undefined);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /v1/pets endpoint and get a result',
      (context) => {
        expect(context.stdout).to.contain('Server started');
      }
    );
});

describe('Run OpenAPI spec from URL (JSON)', () => {
  test
    .stdout()
    .command([
      'start',
      '--data',
      'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml'
    ])
    .do(async () => {
      const result = await axios.get('http://localhost:3000/v1/pets');

      expect(result.data[0].id).to.not.equal(undefined);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /v1/pets endpoint and get a result',
      (context) => {
        expect(context.stdout).to.contain('Server started');
      }
    );
});
