import { Environment } from '@mockoon/commons';
import { strictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../src';
import { getEnvironment } from '../../libs/environment';

describe('Range headers', () => {
  let environment: Environment;
  let server: MockoonServer;

  before(async () => {
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

  it('should return 400 when Range header is malformed', async () => {
    const response = await fetch('http://localhost:3010/file', {
      headers: {
        Range: 'bytes0-5'
      }
    });
    const body = await response.text();

    strictEqual(response.status, 400);
    strictEqual(body, 'Malformed range header');
  });

  it('should return 416 when Range header is unsatisfiable', async () => {
    const response = await fetch('http://localhost:3010/file', {
      headers: {
        Range: 'bytes=5000-5005'
      }
    });
    const body = await response.text();

    strictEqual(response.status, 416);
    strictEqual(body, 'Requested range not satisfiable');
  });

  it('should handle correct range headers', async () => {
    const response = await fetch('http://localhost:3010/file', {
      headers: {
        Range: 'bytes=0-5'
      }
    });
    const body = await response.text();

    // 206 Partial Content
    strictEqual(response.status, 206);
    // assuming the server should respond with the first 5 bytes of a 1234-byte file
    strictEqual(response.headers.get('Content-Range'), 'bytes 0-5/144');
    strictEqual(response.headers.get('Accept-Ranges'), 'bytes');
    strictEqual(response.headers.get('Content-Length'), '6');

    strictEqual(body, 'abcdef');
  });
});
