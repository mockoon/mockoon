import { Environment } from '@mockoon/commons';
import { strictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../../src';
import { getEnvironment } from '../../../libs/environment';

describe('Admin API: data buckets', () => {
  let environment: Environment;
  let server: MockoonServer;
  const port = 3010;
  const url = `http://localhost:${port}`;

  before(async () => {
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

  it('should get first data bucket value using mock endpoint', async () => {
    strictEqual(await (await fetch(`${url}/data-bucket`)).text(), 'true');
  });

  it('should get all data buckets statuses using admin endpoint', async () => {
    strictEqual(
      await (await fetch(`${url}/mockoon-admin/data-buckets`)).text(),
      '[{"id":"vd0v","name":"test","parsed":true,"validJson":true},{"id":"abcd","name":"test2","parsed":true,"validJson":true}]'
    );
  });

  it('should get first data bucket value using admin endpoint', async () => {
    strictEqual(
      await (await fetch(`${url}/mockoon-admin/data-buckets/test`)).text(),
      '{"uuid":"01efb79a-cf0b-4b40-8e3b-79f5a0ee63f4","id":"vd0v","name":"test","value":true,"parsed":true,"validJson":true}'
    );
  });

  it('should get second data bucket value using admin endpoint', async () => {
    strictEqual(
      await (await fetch(`${url}/mockoon-admin/data-buckets/test2`)).text(),
      '{"uuid":"e799d2fc-bb25-4a86-b7d0-43c796719717","id":"abcd","name":"test2","value":{"test":"value"},"parsed":true,"validJson":true}'
    );
  });

  it('should set data bucket value and check again', async () => {
    await fetch(`${url}/data-bucket`, { method: 'POST', body: 'false' });

    strictEqual(await (await fetch(`${url}/data-bucket`)).text(), 'false');
  });

  it('should reset data bucket state using admin api', async () => {
    await fetch(`${url}/mockoon-admin/data-buckets/purge`, { method: 'POST' });

    strictEqual(await (await fetch(`${url}/data-bucket`)).text(), 'true');
  });
});
