import { Environment } from '@mockoon/commons';
import { strictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../../src';
import { getEnvironment } from '../../../libs/environment';
import { adminFetch, testAdminApiToken } from '../../../libs/utils';

describe('Admin API: logs', () => {
  let environment: Environment;
  let server: MockoonServer;
  const port = 3010;
  const url = `http://localhost:${port}`;

  before(async () => {
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

  it('should set call and verify logs length', async () => {
    await fetch(`${url}/test`);
    await fetch(`${url}/test`);
    await fetch(`${url}/test`);

    const logs = await (await adminFetch(url, '/mockoon-admin/logs')).json();

    strictEqual(logs.length, 3);
  });

  it('should test pagination', async () => {
    const logs = await (
      await adminFetch(url, '/mockoon-admin/logs?page=1&limit=2')
    ).json();

    strictEqual(logs.length, 2);

    const logs2 = await (
      await adminFetch(url, '/mockoon-admin/logs?page=2&limit=2')
    ).json();

    strictEqual(logs2.length, 1);

    const logs3 = await (
      await adminFetch(url, '/mockoon-admin/logs?page=3&limit=2')
    ).json();

    strictEqual(logs3.length, 0);
  });

  it('should purge logs and verify length', async () => {
    const purgeRes = await (
      await adminFetch(url, '/mockoon-admin/logs', {
        method: 'PURGE'
      })
    ).json();

    strictEqual(purgeRes.message, 'Logs have been purged');

    const logs = await (await adminFetch(url, '/mockoon-admin/logs')).json();

    strictEqual(logs.length, 0);
  });

  it('should redact sensitive request headers in logs', async () => {
    await fetch(`${url}/test`, {
      headers: {
        Authorization: 'Bearer super-secret-token',
        Cookie: 'session=abc123',
        'X-Api-Key': 'my-api-key',
        'X-Custom-Header': 'not-secret'
      }
    });

    const logs = await (await adminFetch(url, '/mockoon-admin/logs')).json();

    const transaction = logs[logs.length - 1];
    const headerMap: Record<string, string> = Object.fromEntries(
      transaction.request.headers.map((h: { key: string; value: string }) => [
        h.key.toLowerCase(),
        h.value
      ])
    );

    strictEqual(headerMap['authorization'], 'Bearer [REDACTED]');
    strictEqual(headerMap['cookie'], '[REDACTED]');
    strictEqual(headerMap['x-api-key'], '[REDACTED]');
    strictEqual(headerMap['x-custom-header'], 'not-secret');
  });
});
