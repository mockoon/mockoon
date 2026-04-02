import { Environment } from '@mockoon/commons';
import { strictEqual } from 'node:assert';
import { resolve as pathResolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../src';
import { getEnvironment } from '../../libs/environment';

describe('Route metadata headers', () => {
  let environment: Environment;
  let server: MockoonServer;

  before(async () => {
    environment = await getEnvironment('test');
    environment.port = 3011;

    server = new MockoonServer(environment, {
      environmentDirectory: pathResolve('./test/data/environments/')
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

  it('should set route and route response metadata headers', async () => {
    const response = await fetch('http://localhost:3011/test');

    strictEqual(response.status, 200);
    strictEqual(response.headers.get('x-mockoon-route-url'), '/test');
    strictEqual(response.headers.get('x-mockoon-route-method'), 'GET');
    strictEqual(response.headers.get('x-mockoon-route-description'), 'doc');
    strictEqual(
      response.headers.get('x-mockoon-route-uuid'),
      '85e236c4-decc-467c-b288-d243181a250f'
    );
    strictEqual(response.headers.get('x-mockoon-route-response-no'), '1');
    strictEqual(
      response.headers.get('x-mockoon-route-response-uuid'),
      'cd4eb020-310f-4bca-adda-98410cf65a62'
    );
  });
});
