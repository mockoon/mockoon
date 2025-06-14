import { BodyTypes, Environment, RouteType } from '@mockoon/commons';
import { equal } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../src';

describe('Server file serving', () => {
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
        method: 'get',
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
            filePath: 'test.data',
            sendFileAsBody: false,
            disableTemplating: false,
            fallbackTo404: false,
            body: '',
            default: true,
            databucketID: '',
            bodyType: BodyTypes.FILE,
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
        uuid: '87a9537f-f3df-41df-a974-bf1ce697c88a',
        documentation: 'doc',
        method: 'get',
        endpoint: 'test2',
        responses: [
          {
            uuid: 'e101b4da-46b2-4b0a-8159-f90e64599e9b',
            rules: [],
            rulesOperator: 'OR',
            statusCode: 200,
            label: 'Route',
            headers: [],
            latency: 0,
            filePath: 'おはよう.data',
            sendFileAsBody: false,
            disableTemplating: false,
            fallbackTo404: false,
            body: '',
            default: true,
            databucketID: '',
            bodyType: BodyTypes.FILE,
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
      },
      {
        type: 'route',
        uuid: '87a9537f-f3df-41df-a974-bf1ce697c88a'
      }
    ],
    callbacks: []
  };

  describe('Content-Disposition header', () => {
    let server: MockoonServer;

    before((_context, done) => {
      server = new MockoonServer(environment, {
        environmentDirectory: './test/data/'
      });
      server.on('error', () => {
        // empty
      });
      server.on('started', () => {
        done();
      });

      server.start();
    });

    it('should send the content-disposition header', async () => {
      const res = await fetch('http://localhost:3010/test');

      equal(res.status, 200);
      equal(
        res.headers.get('content-disposition'),
        'attachment; filename="test.data"'
      );
    });

    it('should send the content-disposition header encoded when the file name contains UTF-8 characters', async () => {
      const res = await fetch('http://localhost:3010/test2');

      equal(res.status, 200);
      equal(
        res.headers.get('content-disposition'),
        'attachment; filename="%E3%81%8A%E3%81%AF%E3%82%88%E3%81%86.data"'
      );
    });

    after(() => {
      server.stop();
    });
  });
});
