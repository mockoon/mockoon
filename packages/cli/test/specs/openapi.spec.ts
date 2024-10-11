import { test } from '@oclif/test';
import { notStrictEqual, ok } from 'assert';

describe('Run OpenAPI spec (YAML)', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/openapi/petstore.yaml'])
    .do(async () => {
      const result = await (
        await fetch('http://localhost:3000/v1/pets')
      ).json();

      notStrictEqual(result[0].id, undefined);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /v1/pets endpoint and get a result',
      (context) => {
        ok(context.stdout.includes('Server started'));
      }
    );
});

describe('Run OpenAPI spec (JSON)', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/openapi/petstore.json'])
    .do(async () => {
      const result = await (
        await fetch('http://localhost:3000/v1/pets')
      ).json();

      notStrictEqual(result[0].id, undefined);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /v1/pets endpoint and get a result',
      (context) => {
        ok(context.stdout.includes('Server started'));
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
      const result = await (
        await fetch('http://localhost:3000/v1/pets')
      ).json();

      notStrictEqual(result[0].id, undefined);
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /v1/pets endpoint and get a result',
      (context) => {
        ok(context.stdout.includes('Server started'));
      }
    );
});
