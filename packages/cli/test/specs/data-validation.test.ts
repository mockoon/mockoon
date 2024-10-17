import { ok } from 'node:assert';
import { describe, it } from 'node:test';
import { delay, spawnCli } from '../libs/helpers';

/**
 * Test file contains a broken export, with missing `lastMigration` and route methods
 */
describe('Data validation', () => {
  it('should throw an error if repair is not accepted', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/repair.json'
    ]);
    // answer no to repair
    instance.stdin?.write('n\n');

    const { stderr } = await output;

    ok(stderr.includes("These environment's data are too old or not a valid"));
  });

  it('should repair and start mock on port 3000 if repair is accepted', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/repair.json'
    ]);
    // answer yes to repair
    instance.stdin?.write('y\n');

    await delay(3000);

    const call1 = await (await fetch('http://localhost:3000/users')).text();

    ok(call1.includes('ok'));

    instance.kill();

    const { stdout } = await output;

    ok(stdout.includes('Server started'));
    ok(stdout.includes('"environmentName":"Demo API"'));
  });

  it('should repair and start mock on port 3000 if repair was forced with the flag', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/envs/repair.json',
      '--repair'
    ]);

    await delay(3000);

    const call1 = await (await fetch('http://localhost:3000/users')).text();

    ok(call1.includes('ok'));

    instance.kill();

    const { stdout } = await output;

    ok(stdout.includes('Server started'));
    ok(stdout.includes('"environmentName":"Demo API"'));
  });

  it('should show all the error messages (OpenAPI and Mockoon parsers) when opening a broken OpenAPI JSON spec file', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      './test/data/openapi/petstore-broken.json'
    ]);

    // answer no to repair
    instance.stdin?.write('n\n');

    const { stderr } = await output;
    ok(stderr.includes("These environment's data are too old or not a valid"));
    ok(stderr.includes('Openapi API definition'));
  });

  it('should only show OpenAPI parser error messages (early fail as Mockoon does not support YAML)', async () => {
    const { output } = await spawnCli([
      'start',
      '--data',
      './test/data/openapi/petstore-broken.yaml'
    ]);

    const { stderr } = await output;

    ok(stderr.includes('This file is not a valid OpenAPI specification'));
  });
});
