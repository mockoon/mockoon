import { Environment } from '@mockoon/commons';
import { strictEqual } from 'assert';
import { after, before, describe, it } from 'mocha';
import { MockoonServer } from '../../../../src';
import { getEnvironment } from '../../../libs/environment';

describe('Admin API: logs', () => {
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

  it('should set call and verify logs length', async () => {
    await fetch(`${url}/test`);
    await fetch(`${url}/test`);
    await fetch(`${url}/test`);

    const logs = await (await fetch(`${url}/mockoon-admin/logs`)).json();

    strictEqual(logs.length, 3);
  });

  it('should test pagination', async () => {
    const logs = await (
      await fetch(`${url}/mockoon-admin/logs?page=1&limit=2`)
    ).json();

    strictEqual(logs.length, 2);

    const logs2 = await (
      await fetch(`${url}/mockoon-admin/logs?page=2&limit=2`)
    ).json();

    strictEqual(logs2.length, 1);

    const logs3 = await (
      await fetch(`${url}/mockoon-admin/logs?page=3&limit=2`)
    ).json();

    strictEqual(logs3.length, 0);
  });

  it('should purge logs and verify length', async () => {
    const purgeRes = await (
      await fetch(`${url}/mockoon-admin/logs`, { method: 'PURGE' })
    ).json();

    strictEqual(purgeRes.message, 'Logs have been purged');

    const logs = await (await fetch(`${url}/mockoon-admin/logs`)).json();

    strictEqual(logs.length, 0);
  });
});
