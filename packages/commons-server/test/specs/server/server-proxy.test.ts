import { Environment } from '@mockoon/commons';
import { deepEqual, equal } from 'node:assert';
import { createConnection } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../src';
import { getEnvironment } from '../../libs/environment';

describe('Server should handle proxy configuration', () => {
  let proxyEnv: Environment;
  let testEnv: Environment;
  let proxyServer: MockoonServer;
  let testServer: MockoonServer;

  before(async () => {
    // setup: 3001 -> 3000
    proxyEnv = await getEnvironment('proxy');
    testEnv = await getEnvironment('test');
    proxyServer = new MockoonServer(proxyEnv);
    testServer = new MockoonServer(testEnv);
    testServer.start();
    proxyServer.start();
  });

  after(() => {
    testServer.stop();
    proxyServer.stop();
  });

  it('should not Proxy when route is present', async () => {
    const response = await fetch('http://localhost:3001/hard-route');
    equal(response.status, 200);

    const body = await response.json();
    deepEqual(body, { route: 'hard' });
  });

  it('should proxy when route is not present', async () => {
    const response = await fetch('http://localhost:3001/test');
    equal(response.status, 200);

    const body = await response.json();
    deepEqual(body, {});
  });

  it('should return response when request matches', async () => {
    const response = await fetch('http://localhost:3001/test2?rule=match');
    equal(response.status, 200);

    const body = await response.json();
    deepEqual(body, { route: 'match' });
  });

  it('should proxy when request does not matches', async () => {
    const response = await fetch('http://localhost:3001/test2?rule=notmatch');
    equal(response.status, 200);

    const body = await response.json();
    deepEqual(body, { route: 'test2' });
  });

  it('should handle Expect: 100-continue header in proxy requests', async () => {
    // Test that requests with Expect: 100-continue header don't hang when proxying
    // Using raw TCP socket since Node.js fetch doesn't support Expect header
    return new Promise<void>((resolve, reject) => {
      const socket = createConnection(3001, 'localhost');
      socket.setTimeout(5000);

      socket.on('connect', () => {
        // Send a POST request with Expect: 100-continue header to non-existent route
        const request = [
          'POST /nonexistent-route HTTP/1.1',
          'Host: localhost:3001',
          'Content-Type: application/json',
          'Content-Length: 16',
          'Expect: 100-continue',
          '',
          ''
        ].join('\r\n');

        socket.write(request);
      });

      socket.on('data', (data) => {
        const dataStr = data.toString();

        // If we receive 100 Continue, send the body
        if (dataStr.includes('HTTP/1.1 100 Continue')) {
          socket.write('{"test":"data"}\r\n');
        }

        // Check if we received a final response (should be proxied, but getting a 404 is acceptable)
        if (dataStr.includes('HTTP/1.1 404 Not Found')) {
          socket.end();
          resolve();
        }
      });

      // test fails if there is a timeout (i.e. request hangs)
      socket.on('timeout', () => {
        socket.destroy();
        reject(
          new Error('Proxy request with Expect: 100-continue header timed out')
        );
      });
    });
  });
});
