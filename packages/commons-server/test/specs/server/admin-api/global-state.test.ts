import { Environment } from '@mockoon/commons';
import fetch from 'node-fetch';
import { strictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../../src';
import { getEnvironment } from '../../../libs/environment';

describe('Admin API: global state', () => {
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

  it('should set global variable using a GET endpoint from the mock', async () => {
    await fetch(`${url}/set-global-var`);

    strictEqual(await (await fetch(`${url}/get-global-var`)).text(), 'value1');
  });

  it('should purge the state when PURGE request is made to /mockoon-admin/state', async () => {
    const response = await fetch(`${url}/mockoon-admin/state`, {
      method: 'PURGE'
    });
    const body = await response.text();
    strictEqual(
      body,
      '{"response":"Server has been reset to its initial state"}'
    );

    strictEqual(await (await fetch(`${url}/get-global-var`)).text(), '');
  });
});
