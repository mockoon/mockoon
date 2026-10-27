import { BodyTypes, Environment, RouteType } from '@mockoon/commons';
import { match, strictEqual } from 'node:assert';
import { connect } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { WebSocket } from 'ws';
import { MockoonServer } from '../../../src';

const port = 3012;

const environment: Environment = {
  uuid: '0f8a2f2a-0d1a-4b31-9b5a-2f3b6e5a1c11',
  lastMigration: 32,
  name: 'Test env',
  port,
  hostname: '',
  endpointPrefix: '',
  latency: 0,
  routes: [
    {
      uuid: 'a1b3f0f1-2c62-4b2d-9c8f-1a2b3c4d5e6f',
      documentation: '',
      method: 'get',
      endpoint: 'test',
      responses: [
        {
          uuid: 'b2c4e1f2-3d73-4c3e-8d9f-2b3c4d5e6f70',
          rules: [],
          rulesOperator: 'OR',
          statusCode: 200,
          label: '',
          headers: [],
          latency: 0,
          filePath: '',
          sendFileAsBody: false,
          disableTemplating: false,
          fallbackTo404: false,
          body: 'http response',
          default: true,
          databucketID: '',
          bodyType: BodyTypes.INLINE,
          crudKey: 'id',
          callbacks: []
        }
      ],
      responseMode: null,
      type: RouteType.HTTP,
      streamingInterval: 0,
      streamingMode: null
    },
    {
      uuid: 'c3d5f2f3-4e84-4d4f-9eaf-3c4d5e6f7081',
      documentation: '',
      method: 'get',
      endpoint: 'ws',
      responses: [
        {
          uuid: 'd4e6f3f4-5f95-4e50-afbf-4d5e6f708192',
          rules: [],
          rulesOperator: 'OR',
          statusCode: 200,
          label: '',
          headers: [],
          latency: 0,
          filePath: '',
          sendFileAsBody: false,
          disableTemplating: false,
          fallbackTo404: false,
          body: 'ws response',
          default: true,
          databucketID: '',
          bodyType: BodyTypes.INLINE,
          crudKey: 'id',
          callbacks: []
        }
      ],
      responseMode: null,
      type: RouteType.WS,
      streamingInterval: 0,
      streamingMode: null
    }
  ],
  proxyMode: false,
  proxyRemovePrefix: false,
  proxyHost: '',
  proxyReqHeaders: [],
  proxyResHeaders: [],
  cors: false,
  headers: [],
  tlsOptions: {
    enabled: false,
    type: 'CERT',
    pfxPath: '',
    certPath: '',
    keyPath: '',
    caPath: '',
    passphrase: ''
  },
  data: [],
  folders: [],
  rootChildren: [
    { type: 'route', uuid: 'a1b3f0f1-2c62-4b2d-9c8f-1a2b3c4d5e6f' },
    { type: 'route', uuid: 'c3d5f2f3-4e84-4d4f-9eaf-3c4d5e6f7081' }
  ],
  callbacks: []
};

/**
 * Send a raw HTTP request (fetch cannot send "Connection" and "Upgrade" headers)
 * and return the raw response.
 */
const sendRawRequest = (request: string) =>
  new Promise<string>((resolve, reject) => {
    const socket = connect(port, '127.0.0.1', () => {
      socket.write(request);
    });
    socket.setTimeout(2000);
    socket.on('data', (data) => {
      socket.destroy();
      resolve(data.toString());
    });
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('No response received'));
    });
    socket.on('error', reject);
  });

describe('Server connection upgrade', () => {
  let server: MockoonServer;

  before((_context, done) => {
    server = new MockoonServer(environment);
    server.on('error', () => {
      // empty
    });
    server.on('started', () => {
      done();
    });

    server.start();
  });

  it('should handle a non-WebSocket upgrade request (HTTP/2) as a regular request', async () => {
    const response = await sendRawRequest(
      'GET /test HTTP/1.1\r\n' +
        `Host: localhost:${port}\r\n` +
        'Connection: Upgrade, HTTP2-Settings\r\n' +
        'Upgrade: HTTP/2.0\r\n' +
        'HTTP2-Settings: AAEAABAAAAIAAAABAAN_____AAQAAP__AAUAAEAAAAYAACAA\r\n' +
        '\r\n'
    );

    match(response, /^HTTP\/1\.1 200 OK/);
    match(response, /http response$/);
  });

  it('should still handle WebSocket upgrade requests', async () => {
    const message = await new Promise<string>((resolve, reject) => {
      const client = new WebSocket(`ws://localhost:${port}/ws`);

      client.on('open', () => {
        client.send('hello');
      });
      client.on('message', (data) => {
        client.close();
        resolve(data.toString());
      });
      client.on('error', reject);
    });

    strictEqual(message, 'ws response');
  });

  after(() => {
    server.stop();
  });
});
