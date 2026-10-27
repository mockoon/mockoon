import { Environment } from '@mockoon/commons';
import { strictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../../src';
import { getEnvironment } from '../../../libs/environment';
import { adminFetch, testAdminApiToken } from '../../../libs/utils';

describe('Admin API: env vars', () => {
  let environment: Environment;
  let server: MockoonServer;
  const port = 3010;
  const url = `http://localhost:${port}`;

  before(async () => {
    process.env['MOCKOON_TEST_VAR'] = 'env-var-value';
    environment = await getEnvironment('test');
    environment.port = port;
    server = new MockoonServer(environment, {
      adminApiAuthToken: testAdminApiToken
    });
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
      await (
        await adminFetch(url, '/mockoon-admin/env-vars/UNKNOWN_NAME')
      ).text(),
      '{"message":"Environment variable not found"}'
    );
  });

  it('should get env var from the system using admin GET route, without prefix', async () => {
    strictEqual(
      await (await adminFetch(url, '/mockoon-admin/env-vars/TEST_VAR')).text(),
      '{"key":"MOCKOON_TEST_VAR","value":"env-var-value"}'
    );
  });

  it('should get env var from the system using admin GET route, with prefix', async () => {
    strictEqual(
      await (
        await adminFetch(url, '/mockoon-admin/env-vars/MOCKOON_TEST_VAR')
      ).text(),
      '{"key":"MOCKOON_TEST_VAR","value":"env-var-value"}'
    );
  });

  it('should reject unauthenticated requests', async () => {
    strictEqual(
      (await fetch(`${url}/mockoon-admin/env-vars/TEST_VAR`)).status,
      401
    );
  });

  it('should set env variable on POST to /mockoon-admin/env-vars', async () => {
    const key = 'MOCKOON_TEST_VAR';
    const value = 'env-var-value2';
    const response = await adminFetch(url, '/mockoon-admin/env-vars', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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

  it('should auto-prepend the env vars prefix when setting a variable without prefix', async () => {
    const key = 'TEST_VAR';
    const value = 'env-var-value3';
    const response = await adminFetch(url, '/mockoon-admin/env-vars', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key, value })
    });
    const body = await response.text();
    strictEqual(
      body,
      `{"message":"Environment variable 'MOCKOON_TEST_VAR' has been set to '${value}'"}`
    );

    strictEqual(process.env['MOCKOON_TEST_VAR'], value);
  });

  it('should not allow writes to env vars outside the configured prefix', async () => {
    const originalPath = process.env['PATH'];
    const response = await adminFetch(url, '/mockoon-admin/env-vars', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key: 'PATH', value: 'malicious-path' })
    });
    const body = await response.json();

    strictEqual(response.status, 200);
    strictEqual(
      body.message,
      "Environment variable 'MOCKOON_PATH' has been set to 'malicious-path'"
    );
    strictEqual(process.env['PATH'], originalPath);
    strictEqual(process.env['MOCKOON_PATH'], 'malicious-path');
  });
});

describe('Admin API: env vars with empty prefix', () => {
  let environment: Environment;
  let server: MockoonServer;
  const port = 3015;
  const url = `http://localhost:${port}`;

  before(async () => {
    environment = await getEnvironment('test');
    environment.port = port;
    server = new MockoonServer(environment, {
      adminApiAuthToken: testAdminApiToken,
      envVarsPrefix: ''
    });
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

  it('should reject env variable writes when the prefix is empty', async () => {
    const response = await adminFetch(url, '/mockoon-admin/env-vars', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key: 'ANY_VAR', value: 'value' })
    });

    strictEqual(response.status, 403);
    strictEqual(
      await response.text(),
      '{"message":"Environment variable writes are disabled when the prefix is empty"}'
    );
    strictEqual(process.env['ANY_VAR'], undefined);
  });
});
