import * as cliUX from '@oclif/core/lib/cli-ux';
import { test } from '@oclif/test';
import { doesNotMatch, match } from 'assert';

/**
 * Test file contains a broken export, with missing `lastMigration` and route methods
 */
describe('Data validation', () => {
  describe('Repair not accepted', () => {
    test
      .stderr()
      .stub(cliUX, 'confirm', (stub) => stub.returns(false))
      .command(['start', '--data', './test/data/envs/repair.json'])
      .catch((context) => {
        match(
          context.message,
          /These environment's data are too old or not a valid Mockoon environment./
        );
      })
      .it('should throw an error if repair is not accepted');
  });

  describe('Repair accepted', () => {
    test
      .stdout()
      .stub(cliUX, 'confirm', (stub) => stub.returns(true))
      .command(['start', '--data', './test/data/envs/repair.json'])
      .do(async () => {
        const call1 = await (await fetch('http://localhost:3000/users')).text();

        match(call1, /ok/);
      })
      .finally(() => {
        process.emit('SIGINT');
      })
      .it(
        'should repair and start mock on port 3000 if repair is accepted, and call GET /users endpoint and get a result',
        (context) => {
          match(context.stdout, /Server started/);
          match(context.stdout, /"environmentName":"Demo API"/);
        }
      );
  });

  describe('Repair forced with flag', () => {
    test
      .stdout()
      .command(['start', '--data', './test/data/envs/repair.json', '--repair'])
      .do(async () => {
        const call1 = await (await fetch('http://localhost:3000/users')).text();

        match(call1, /ok/);
      })
      .finally(() => {
        process.emit('SIGINT');
      })
      .it(
        'should repair and start mock on port 3000 if repair was forced with the flag',
        (context) => {
          match(context.stdout, /Server started/);
          match(context.stdout, /"environmentName":"Demo API"/);
        }
      );
  });

  describe('Broken OpenAPI JSON', () => {
    test
      .stderr()
      .stub(cliUX, 'confirm', (stub) => stub.returns(false))
      .command(['start', '--data', './test/data/openapi/petstore-broken.json'])
      .catch((context) => {
        match(
          context.message,
          /These environment's data are too old or not a valid Mockoon environment./
        );
        match(context.message, /is not a valid Openapi API definition/);
      })
      .it('should show all the error messages (OpenAPI and Mockoon parsers');
  });

  describe('Broken OpenAPI YAML', () => {
    test
      .stderr()
      .stub(cliUX, 'confirm', (stub) => stub.returns(false))
      .command(['start', '--data', './test/data/openapi/petstore-broken.yaml'])
      .catch((context) => {
        doesNotMatch(
          context.message,
          /These environment's data are too old or not a valid Mockoon environment./
        );
        match(context.message, /is not a valid Openapi API definition/);
      })
      .it(
        'should only show OpenAPI parser error messages (early fail as Mockoon does not support YAML)'
      );
  });
});
