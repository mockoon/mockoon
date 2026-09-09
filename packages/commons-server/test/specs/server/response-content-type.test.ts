import { BodyTypes, Environment, RouteType } from '@mockoon/commons';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { resolve as pathResolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../src';

describe('Response Content-Type headers', () => {
  let server: MockoonServer;

  before(async () => {
    const environment: Environment = {
      uuid: 'env-content-type-uuid',
      lastMigration: 32,
      name: 'Content-Type Test',
      endpointPrefix: '',
      latency: 0,
      port: 3013,
      hostname: '',
      routes: [
        {
          uuid: 'route-1',
          type: RouteType.HTTP,
          documentation: '',
          method: 'get',
          endpoint: 'json-no-charset',
          responses: [
            {
              uuid: 'resp-1',
              body: '{"message":"hello"}',
              latency: 0,
              statusCode: 200,
              label: '',
              headers: [
                {
                  key: 'Content-Type',
                  value: 'application/json'
                }
              ],
              bodyType: BodyTypes.INLINE,
              filePath: '',
              databucketID: '',
              sendFileAsBody: false,
              rules: [],
              rulesOperator: 'OR',
              disableTemplating: false,
              fallbackTo404: false,
              default: true,
              crudKey: 'id',
              callbacks: []
            }
          ],
          responseMode: null,
          streamingMode: null,
          streamingInterval: 0
        },
        {
          uuid: 'route-2',
          type: RouteType.HTTP,
          documentation: '',
          method: 'get',
          endpoint: 'json-utf8-charset',
          responses: [
            {
              uuid: 'resp-2',
              body: '{"message":"hello"}',
              latency: 0,
              statusCode: 200,
              label: '',
              headers: [
                {
                  key: 'Content-Type',
                  value: 'application/json; charset=utf-8'
                }
              ],
              bodyType: BodyTypes.INLINE,
              filePath: '',
              databucketID: '',
              sendFileAsBody: false,
              rules: [],
              rulesOperator: 'OR',
              disableTemplating: false,
              fallbackTo404: false,
              default: true,
              crudKey: 'id',
              callbacks: []
            }
          ],
          responseMode: null,
          streamingMode: null,
          streamingInterval: 0
        },
        {
          uuid: 'route-3',
          type: RouteType.HTTP,
          documentation: '',
          method: 'get',
          endpoint: 'json-iso-charset',
          responses: [
            {
              uuid: 'resp-3',
              body: '{"greeting":"café"}',
              latency: 0,
              statusCode: 200,
              label: '',
              headers: [
                {
                  key: 'Content-Type',
                  value: 'application/json; charset=iso-8859-1'
                }
              ],
              bodyType: BodyTypes.INLINE,
              filePath: '',
              databucketID: '',
              sendFileAsBody: false,
              rules: [],
              rulesOperator: 'OR',
              disableTemplating: false,
              fallbackTo404: false,
              default: true,
              crudKey: 'id',
              callbacks: []
            }
          ],
          responseMode: null,
          streamingMode: null,
          streamingInterval: 0
        },
        {
          uuid: 'route-4',
          type: RouteType.HTTP,
          documentation: '',
          method: 'get',
          endpoint: 'text-plain',
          responses: [
            {
              uuid: 'resp-4',
              body: 'plain text response',
              latency: 0,
              statusCode: 200,
              label: '',
              headers: [
                {
                  key: 'Content-Type',
                  value: 'text/plain'
                }
              ],
              bodyType: BodyTypes.INLINE,
              filePath: '',
              databucketID: '',
              sendFileAsBody: false,
              rules: [],
              rulesOperator: 'OR',
              disableTemplating: false,
              fallbackTo404: false,
              default: true,
              crudKey: 'id',
              callbacks: []
            }
          ],
          responseMode: null,
          streamingMode: null,
          streamingInterval: 0
        },
        {
          uuid: 'route-5',
          type: RouteType.HTTP,
          documentation: '',
          method: 'get',
          endpoint: 'custom-content-type',
          responses: [
            {
              uuid: 'resp-5',
              body: '<xml>test</xml>',
              latency: 0,
              statusCode: 200,
              label: '',
              headers: [
                {
                  key: 'Content-Type',
                  value: 'application/xml'
                }
              ],
              bodyType: BodyTypes.INLINE,
              filePath: '',
              databucketID: '',
              sendFileAsBody: false,
              rules: [],
              rulesOperator: 'OR',
              disableTemplating: false,
              fallbackTo404: false,
              default: true,
              crudKey: 'id',
              callbacks: []
            }
          ],
          responseMode: null,
          streamingMode: null,
          streamingInterval: 0
        },
        {
          uuid: 'route-6',
          type: RouteType.HTTP,
          documentation: '',
          method: 'get',
          endpoint: 'inherit-env-header',
          responses: [
            {
              uuid: 'resp-6',
              body: '{"env":"inherited"}',
              latency: 0,
              statusCode: 200,
              label: '',
              headers: [],
              bodyType: BodyTypes.INLINE,
              filePath: '',
              databucketID: '',
              sendFileAsBody: false,
              rules: [],
              rulesOperator: 'OR',
              disableTemplating: false,
              fallbackTo404: false,
              default: true,
              crudKey: 'id',
              callbacks: []
            }
          ],
          responseMode: null,
          streamingMode: null,
          streamingInterval: 0
        }
      ],
      proxyMode: false,
      proxyHost: '',
      proxyRemovePrefix: false,
      tlsOptions: {
        enabled: false,
        type: 'CERT',
        pfxPath: '',
        certPath: '',
        keyPath: '',
        caPath: '',
        passphrase: ''
      },
      cors: true,
      headers: [
        {
          key: 'Content-Type',
          value: 'application/vnd.api+json'
        }
      ],
      proxyReqHeaders: [],
      proxyResHeaders: [],
      data: [],
      callbacks: [],
      folders: [],
      rootChildren: [
        { type: 'route', uuid: 'route-1' },
        { type: 'route', uuid: 'route-2' },
        { type: 'route', uuid: 'route-3' },
        { type: 'route', uuid: 'route-4' },
        { type: 'route', uuid: 'route-5' },
        { type: 'route', uuid: 'route-6' }
      ]
    };

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

  it('should let Express add charset=utf-8 when Content-Type is application/json without charset', async () => {
    const response = await fetch('http://localhost:3013/json-no-charset');

    strictEqual(response.status, 200);
    strictEqual(
      response.headers.get('content-type'),
      'application/json; charset=utf-8'
    );
    const body = await response.json();
    deepStrictEqual(body, { message: 'hello' });
  });

  it('should preserve explicit charset=utf-8 when defined', async () => {
    const response = await fetch('http://localhost:3013/json-utf8-charset');

    strictEqual(response.status, 200);
    strictEqual(
      response.headers.get('content-type'),
      'application/json; charset=utf-8'
    );
    const body = await response.json();
    deepStrictEqual(body, { message: 'hello' });
  });

  it('should preserve explicit charset=iso-8859-1 and encode body accordingly', async () => {
    const response = await fetch('http://localhost:3013/json-iso-charset');

    strictEqual(response.status, 200);
    strictEqual(
      response.headers.get('content-type'),
      'application/json; charset=iso-8859-1'
    );
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = buffer.toString('latin1');
    deepStrictEqual(JSON.parse(text), { greeting: 'café' });
    // In ISO-8859-1 (Latin-1), 'é' is 1 byte (0xE9), not UTF-8 2 bytes (0xC3 0xA9)
    strictEqual(buffer.includes(0xe9), true);
  });

  it('should let Express add charset=utf-8 when Content-Type is text/plain without charset', async () => {
    const response = await fetch('http://localhost:3013/text-plain');

    strictEqual(response.status, 200);
    strictEqual(
      response.headers.get('content-type'),
      'text/plain; charset=utf-8'
    );
    const body = await response.text();
    strictEqual(body, 'plain text response');
  });

  it('should let Express add charset=utf-8 when Content-Type is application/xml without charset', async () => {
    const response = await fetch('http://localhost:3013/custom-content-type');

    strictEqual(response.status, 200);
    strictEqual(
      response.headers.get('content-type'),
      'application/xml; charset=utf-8'
    );
    const body = await response.text();
    strictEqual(body, '<xml>test</xml>');
  });

  it('should let Express apply default header processing on inherited environment Content-Type', async () => {
    const response = await fetch('http://localhost:3013/inherit-env-header');

    strictEqual(response.status, 200);
    strictEqual(
      response.headers.get('content-type'),
      'application/vnd.api+json; charset=utf-8'
    );
  });
});
