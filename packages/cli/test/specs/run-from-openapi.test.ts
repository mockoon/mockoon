import { notStrictEqual, ok } from 'node:assert';
import { describe, it } from 'node:test';
import { spawnCli } from '../libs/helpers';

describe('Run from OpenAPI spec', () => {
  it('should run from YAML OpenAPI spec', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/openapi/petstore.yaml'
    ]);

    const result = await (await fetch('http://localhost:3000/v1/pets')).json();

    notStrictEqual(result[0].id, undefined);

    instance.kill();

    const { stdout } = await output;

    ok(stdout.includes('Server started'));
  });

  it('should run from JSON OpenAPI spec', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/openapi/petstore.json'
    ]);

    const result = await (await fetch('http://localhost:3000/v1/pets')).json();

    notStrictEqual(result[0].id, undefined);

    instance.kill();

    const { stdout } = await output;

    ok(stdout.includes('Server started'));
  });

  it('should run from JSON URL OpenAPI spec', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml'
    ]);

    const result = await (await fetch('http://localhost:3000/v1/pets')).json();

    notStrictEqual(result[0].id, undefined);

    instance.kill();

    const { stdout } = await output;

    ok(stdout.includes('Server started'));
  });
});
