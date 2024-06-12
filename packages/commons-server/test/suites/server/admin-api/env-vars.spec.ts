import { Environment } from '@mockoon/commons';
import { strictEqual } from 'assert';
import { after, before, describe, it } from 'mocha';
import fetch from 'node-fetch';
import { MockoonServer } from '../../../../src';
import { getEnvironment } from '../../../libs/environment';

describe('Admin API: env vars', () => {
  let environment: Environment;
  let server: MockoonServer;
  const port = 3010;
  const url = `http://localhost:${port}`;

  before(async () => {
    process.env['MOCKOON_TEST_VAR'] = 'env-var-value';
    environment = await getEnvironment('test');
    environment.port = port;
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

  it('should get env var from the system', async () => {
    strictEqual(
      await (await fetch(`${url}/get-env-var`)).text(),
      'env-var-value'
    );
  });

  it('should set env variable on POST to /mockoon-admin/env-vars', async () => {
    const key = 'MOCKOON_TEST_VAR';
    const value = 'env-var-value2';
    const response = await fetch(`${url}/mockoon-admin/env-vars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    const body = await response.text();
    strictEqual(
      body,
      `{"message":"Environment variable '${key}' has been set to '${value}'"}`
    );

    strictEqual(
      await (await fetch(`${url}/get-env-var`)).text(),
      'env-var-value2'
    );
  });
});
