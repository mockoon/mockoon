import { Environment } from '@mockoon/commons';
import { strictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../src';
import { getEnvironment } from '../../libs/environment';

describe('Env vars prefix default', () => {
  let environment: Environment;
  let server: MockoonServer;

  before(async () => {
    process.env.MOCKOON_TEST_ENV_VAR = 'testenvvar';
    process.env.OTHER_VAR = 'othervar';

    environment = await getEnvironment('test');
    environment.port = 3010;

    server = new MockoonServer(environment);

    await new Promise((resolve, reject) => {
      server.on('started', () => {
        resolve(true);
      });

      server.on('error', (error) => {
        reject(error);
      });

      server.start();
    });
  });

  after(() => {
    server.stop();
  });

  it('should receive the env var content when prefix is the default and should not include other env vars', async () => {
    const response = await fetch('http://localhost:3010/envvar-prefix-default');
    const body = await response.text();

    strictEqual(body, 'testenvvar-testenvvar-');
  });
});

describe('Env vars prefix custom', () => {
  let environment: Environment;
  let server: MockoonServer;

  before(async () => {
    process.env.OTHER_VAR = 'othervar';
    process.env.PREFIX_TEST_ENV_VAR = 'testenvvar';

    environment = await getEnvironment('test');
    environment.port = 3010;

    server = new MockoonServer(environment, { envVarsPrefix: 'PREFIX_' });

    await new Promise((resolve, reject) => {
      server.on('started', () => {
        resolve(true);
      });

      server.on('error', (error) => {
        reject(error);
      });

      server.start();
    });
  });

  after(() => {
    server.stop();
  });

  it('should receive the env var content when prefix is a custom one and should not include other env vars', async () => {
    const response = await fetch('http://localhost:3010/envvar-prefix-custom');
    const body = await response.text();

    strictEqual(body, 'testenvvar-testenvvar-');
  });
});

describe('Env vars prefix none', () => {
  let environment: Environment;
  let server: MockoonServer;

  before(async () => {
    process.env.OTHER_VAR = 'othervar';
    process.env.PREFIX_TEST_ENV_VAR = 'testenvvar';

    environment = await getEnvironment('test');
    environment.port = 3010;

    server = new MockoonServer(environment, { envVarsPrefix: '' });

    await new Promise((resolve, reject) => {
      server.on('started', () => {
        resolve(true);
      });

      server.on('error', (error) => {
        reject(error);
      });

      server.start();
    });
  });

  after(() => {
    server.stop();
  });

  it('should receive the env var content when there is no prefix and should be able to access other env vars', async () => {
    const response = await fetch('http://localhost:3010/envvar-no-prefix');
    const body = await response.text();

    strictEqual(body, 'testenvvar-othervar');
  });
});
