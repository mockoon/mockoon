import { Environment } from '@mockoon/commons';
import { strictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';
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
    server = new MockoonServer(environment, {});
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

  it('should get env var from the system using helpers', async () => {
    strictEqual(
      await (await fetch(`${url}/get-env-var`)).text(),
      'env-var-value'
    );
  });

  it("should get 404 if var doesn't exists", async () => {
    strictEqual(
      await (await fetch(`${url}/mockoon-admin/env-vars/UNKNOWN_NAME`)).text(),
      '{"message":"Environment variable not found"}'
    );
  });

  it('should get env var from the system using admin GET route, without prefix', async () => {
    strictEqual(
      await (await fetch(`${url}/mockoon-admin/env-vars/TEST_VAR`)).text(),
      '{"key":"MOCKOON_TEST_VAR","value":"env-var-value"}'
    );
  });

  it('should get env var from the system using admin GET route, with prefix', async () => {
    strictEqual(
      await (
        await fetch(`${url}/mockoon-admin/env-vars/MOCKOON_TEST_VAR`)
      ).text(),
      '{"key":"MOCKOON_TEST_VAR","value":"env-var-value"}'
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
