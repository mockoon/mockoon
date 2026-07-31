import { BodyTypes, Environment, RouteType } from '@mockoon/commons';
import { deepEqual, strictEqual } from 'node:assert';
import { EventEmitter } from 'node:events';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../src';

describe('Server body parsing', () => {
  const environment: Environment = {
    uuid: 'c6199444-5116-490a-99a2-074876253a4a',
    lastMigration: 32,
    name: 'Test env',
    port: 3010,
    hostname: '',
    endpointPrefix: '',
    latency: 0,
    routes: [
      {
        uuid: '85e236c4-decc-467c-b288-d243181a250f',
        documentation: 'doc',
        method: 'post',
        endpoint: 'test',
        responses: [
          {
            uuid: 'cd4eb020-310f-4bca-adda-98410cf65a62',
            rules: [],
            rulesOperator: 'OR',
            statusCode: 200,
            label: 'Route',
            headers: [],
            latency: 0,
            filePath: '',
            sendFileAsBody: false,
            disableTemplating: false,
            fallbackTo404: false,
            body: '{{{stringify (bodyRaw)}}}',
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
      }
    ],
    proxyMode: false,
    proxyRemovePrefix: false,
    proxyHost: '',
    proxyReqHeaders: [],
    proxyResHeaders: [],
    cors: false,
    headers: [
      {
        key: 'Content-Type',
        value: 'application/json'
      }
    ],
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
      {
        type: 'route',
        uuid: '85e236c4-decc-467c-b288-d243181a250f'
      }
    ],
    callbacks: []
  };

  describe('Multipart form data', () => {
    let server: MockoonServer;

    before((_context, done) => {
      server = new MockoonServer(environment);

      server.on('started', () => {
        done();
      });

      server.start();
    });

    it('should parse a multipart form data request body with single field and file', async () => {
      const formData = new FormData();
      formData.set('field1', 'value1');
      formData.set(
        'file1',
        new Blob(['file1 content'], { type: 'text/plain' }),
        'file1.txt'
      );

      const data = await (
        await fetch('http://localhost:3010/test', {
          method: 'POST',
          body: formData
        })
      ).json();

      deepEqual(data, {
        field1: 'value1',
        file1: {
          filename: 'file1.txt',
          mimetype: 'text/plain',
          size: 13
        }
      });
    });

    it('should parse a multipart form data request body with fields and files (arrays)', async () => {
      const formData = new FormData();
      formData.set('fields', 'value2');
      formData.append('fields', 'value3');
      formData.set(
        'files',
        new Blob(['file2 content'], { type: 'text/plain' }),
        'file2.txt'
      );
      formData.append(
        'files',
        new Blob(['file3 content'], { type: 'text/plain' }),
        'file3.txt'
      );

      const data = await (
        await fetch('http://localhost:3010/test', {
          method: 'POST',
          body: formData
        })
      ).json();

      deepEqual(data, {
        fields: ['value2', 'value3'],
        files: [
          {
            filename: 'file2.txt',
            mimetype: 'text/plain',
            size: 13
          },
          {
            filename: 'file3.txt',
            mimetype: 'text/plain',
            size: 13
          }
        ]
      });
    });

    after(() => {
      server.stop();
    });
  });

  describe('Duplicate request end events', () => {
    it('should only advance the routing pipeline once when end is emitted twice', () => {
      const server = new MockoonServer(environment);
      let nextCalls = 0;

      const request = new EventEmitter() as RequestLike;
      request.headers = {};
      request.header = () => undefined;

      (server as any).parseBody(request, {} as any, () => {
        nextCalls += 1;
      });

      request.emit('end');
      request.emit('end');

      strictEqual(nextCalls, 1);
      strictEqual(request.stringBody, '');
      strictEqual(request.rawBody?.toString('utf8'), '');
    });
  });

  describe('Oversized body socket handling', () => {
    it('should destroy request socket only after sending 413', () => {
      const server = new MockoonServer(environment, {
        maxRequestBodySize: 4
      });
      const request = new EventEmitter() as RequestLike;
      request.headers = {};
      request.header = () => 'application/octet-stream';

      let destroyCalled = false;
      request.destroy = () => {
        destroyCalled = true;

        return request;
      };

      const response = new EventEmitter() as ResponseLike;
      response.set = () => response;
      response.status = () => response;
      response.send = () => response;

      (server as any).parseBody(request, response, () => {
        throw new Error('next should not be called for oversized body');
      });

      request.emit('data', Buffer.from('12345'));
      request.emit('end');

      strictEqual(destroyCalled, false);

      response.emit('finish');

      strictEqual(destroyCalled, true);
    });
  });

  describe('Request body size limit', () => {
    let server: MockoonServer;

    before((_context, done) => {
      server = new MockoonServer(
        {
          ...environment,
          uuid: 'a1176212-0a15-4f4a-9af4-03c0f0f902a1',
          port: 3011
        },
        {
          maxRequestBodySize: 32
        }
      );

      server.on('started', () => {
        done();
      });

      server.start();
    });

    it('should reject request bodies larger than the configured maximum with 413', async () => {
      const transactionPromise = new Promise<any>((resolve) => {
        server.once('transaction-complete', (transaction) => {
          resolve(transaction);
        });
      });

      const response = await fetch('http://localhost:3011/no-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: 'x'.repeat(64)
      });
      const transaction = await transactionPromise;

      strictEqual(response.status, 413);
      strictEqual(await response.text(), 'Payload too large');
      strictEqual(transaction.response.statusCode, 413);
    });

    after(() => {
      server.stop();
    });
  });
});

type RequestLike = EventEmitter & {
  headers: Record<string, string>;
  rawBody?: Buffer;
  stringBody?: string;
  body?: unknown;
  header(name: string): string | undefined;
  destroy(): RequestLike;
};

type ResponseLike = EventEmitter & {
  set(name: string, value: string): ResponseLike;
  status(code: number): ResponseLike;
  send(content: string): ResponseLike;
};
