import { Environment } from '@mockoon/commons';
import { strictEqual } from 'assert';
import { after, before, describe, it } from 'mocha';
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

  it('should get data bucket value', async () => {
    strictEqual(await (await fetch(`${url}/data-bucket`)).text(), 'true');
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
