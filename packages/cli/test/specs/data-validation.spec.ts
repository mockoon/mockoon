import * as cliUX from '@oclif/core/lib/cli-ux';
import { test } from '@oclif/test';
import { expect } from 'chai';

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
        expect(context.message).to.contain(
          "These environment's data are too old or not a valid Mockoon environment."
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

        expect(call1).to.contain('ok');
      })
      .finally(() => {
        process.emit('SIGINT');
      })
      .it(
        'should repair and start mock on port 3000 if repair is accepted, and call GET /users endpoint and get a result',
        (context) => {
          expect(context.stdout).to.contain('Server started');
          expect(context.stdout).to.contain('"environmentName":"Demo API"');
        }
      );
  });

  describe('Repair forced with flag', () => {
    test
      .stdout()
      .command(['start', '--data', './test/data/envs/repair.json', '--repair'])
      .do(async () => {
        const call1 = await (await fetch('http://localhost:3000/users')).text();

        expect(call1).to.contain('ok');
      })
      .finally(() => {
        process.emit('SIGINT');
      })
      .it(
        'should repair and start mock on port 3000 if repair was forced with the flag',
        (context) => {
          expect(context.stdout).to.contain('Server started');
          expect(context.stdout).to.contain('"environmentName":"Demo API"');
        }
      );
  });
});
