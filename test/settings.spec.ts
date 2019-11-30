import { Tests } from './lib/tests';
import { HttpCall } from './lib/types';

const tests = new Tests('basic-data');

function generateCall(requestBody: any): HttpCall {
  return {
    description: 'Call POST dolphins',
    path: '/dolphins',
    method: 'POST',
    body: requestBody,
    testedProperties: {
      body: '{"response":"So Long, and Thanks for All the Fish"}',
      status: 200
    }
  };
}

function makeString(length: number): string {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

const inputBodySize = `.modal-dialog input[ngbTooltip="Log's body size"]`;

describe('Settings Dialog', () => {
  tests.runHooks();

  it('Start the environment', async () => {
    await tests.helpers.startEnvironment();
    await tests.helpers.switchViewInHeader('ENV_LOGS');
  });

  describe('Log variable size', () => {
    it('Set size to 100', async () => {
      await tests.helpers.openSettingsModal();
      await tests.spectron.client.element(inputBodySize).setValue('100');
      await tests.helpers.closeSettingsModal();
    });

    it('The size is 100, do not truncate on 99', async () => {
      const str = makeString(99);
      await tests.helpers.httpCallAsserter(generateCall(str));
      await tests.helpers.countEnvironmentLogsEntries(1);
      await tests.helpers.requestLogBodyContains(str);
    });

    it('The default size is 100, do truncate on 100', async () => {
      const str = makeString(100);
      await tests.helpers.httpCallAsserter(generateCall(str));
      await tests.helpers.countEnvironmentLogsEntries(2);
      await tests.helpers.requestLogBodyContains('BODY HAS BEEN TRUNCATED');
    });

    it('Set size to 1000', async () => {
      await tests.helpers.openSettingsModal();
      await tests.spectron.client.element(inputBodySize).setValue('1000');
      await tests.helpers.closeSettingsModal();
    });

    it('The size is 1000, do not truncate on 999', async () => {
      const str = makeString(999);
      await tests.helpers.httpCallAsserter(generateCall(str));
      await tests.helpers.countEnvironmentLogsEntries(3);
      await tests.helpers.requestLogBodyContains(str);
    });

    it('The default size is 1000, do truncate on 1000', async () => {
      const str = makeString(1000);
      await tests.helpers.httpCallAsserter(generateCall(str));
      await tests.helpers.countEnvironmentLogsEntries(4);
      await tests.helpers.requestLogBodyContains('BODY HAS BEEN TRUNCATED');
    });
  });
});
