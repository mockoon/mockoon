import { Environment } from '@mockoon/commons';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { once } from 'node:events';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../src';
import { getEnvironment } from '../../libs/environment';
import { adminFetch, testAdminApiToken } from '../../libs/utils';

describe('Express 5 compatibility', () => {
  let environment: Environment;
  let mockoonServer: MockoonServer;
  let httpServer: Server;
  let url: string;

  before(async () => {
    environment = await getEnvironment('test');
    environment.cors = true;
    environment.routes = ['', 'nested/:id', 'custom-options/:id'].map(
      (endpoint, index) => {
        const route = structuredClone(environment.routes[0]);
        route.uuid = `express5-route-${index}`;
        route.endpoint = endpoint;
        route.method = index === 2 ? 'options' : 'get';
        route.responses[0].body =
          index === 1 ? '{{urlParam "id"}}' : '{{{stringify (queryParams)}}}';
        route.responses[0].statusCode = index === 2 ? 202 : 200;

        return route;
      }
    );
    environment.rootChildren = environment.routes.map((route) => ({
      type: 'route',
      uuid: route.uuid
    }));
    mockoonServer = new MockoonServer(environment, {
      adminApiAuthToken: testAdminApiToken
    });
    httpServer = createServer(mockoonServer.createRequestListener());
    httpServer.listen(0, '127.0.0.1');
    await once(httpServer, 'listening');
    url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
  });

  after(async () => {
    if (httpServer?.listening) {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('should dispatch the root path through the REST catch-all', async () => {
    const response = await fetch(`${url}/`);

    strictEqual(response.status, 200);
    deepStrictEqual(await response.json(), {});
  });

  it('should use the dynamic matcher for nested route parameters', async () => {
    const response = await fetch(`${url}/nested/123`);

    strictEqual(response.status, 200);
    strictEqual(await response.text(), '123');
  });

  it('should preserve extended query parsing in templates and logs', async () => {
    const response = await fetch(
      `${url}/?filter[name]=value&tags[]=first&tags[]=second&repeat=a&repeat=b`
    );
    const expectedQuery = {
      filter: { name: 'value' },
      tags: ['first', 'second'],
      repeat: ['a', 'b']
    };

    strictEqual(response.status, 200);
    deepStrictEqual(await response.json(), expectedQuery);

    const logs = await (await adminFetch(url, '/mockoon-admin/logs')).json();
    deepStrictEqual(logs[logs.length - 1].request.queryParams, expectedQuery);
  });

  it('should handle CORS preflight at the root and nested paths', async () => {
    for (const path of ['/', '/unmatched/nested']) {
      const response = await fetch(`${url}${path}`, { method: 'OPTIONS' });

      strictEqual(response.status, 200);
      strictEqual(response.headers.get('access-control-allow-origin'), '*');
      await response.text();

      const logs = await (await adminFetch(url, '/mockoon-admin/logs')).json();
      deepStrictEqual(logs[logs.length - 1].request.params, []);
    }
  });

  it('should preserve parameters on user-defined OPTIONS routes', async () => {
    const response = await fetch(`${url}/custom-options/123`, {
      method: 'OPTIONS'
    });

    strictEqual(response.status, 202);
    await response.text();

    const logs = await (await adminFetch(url, '/mockoon-admin/logs')).json();
    deepStrictEqual(logs[logs.length - 1].request.params, [
      { name: 'id', value: '123' }
    ]);
  });

  it('should proxy unmatched requests without changing the path or query', async () => {
    const proxy = new MockoonServer({
      ...environment,
      routes: [],
      rootChildren: [],
      proxyMode: true,
      proxyHost: url
    });
    const proxyHttpServer = createServer(proxy.createRequestListener());
    proxyHttpServer.listen(0, '127.0.0.1');
    await once(proxyHttpServer, 'listening');

    try {
      const proxyUrl = `http://127.0.0.1:${(proxyHttpServer.address() as AddressInfo).port}`;
      const response = await fetch(
        `${proxyUrl}/?filter[name]=value&tags[]=first`
      );

      strictEqual(response.status, 200);
      deepStrictEqual(await response.json(), {
        filter: { name: 'value' },
        tags: ['first']
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        proxyHttpServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('should protect the admin root and nested paths', async () => {
    for (const path of ['/mockoon-admin', '/mockoon-admin/logs']) {
      const unauthorized = await fetch(`${url}${path}`);
      strictEqual(unauthorized.status, 401);
      await unauthorized.text();

      const authorized = await adminFetch(url, path);
      strictEqual(authorized.status, 200);
      await authorized.text();
    }
  });

  it('should retain SSE query-token authentication only for the events endpoint', async () => {
    const controller = new AbortController();
    try {
      const response = await fetch(
        `${url}/mockoon-admin/events?token=${testAdminApiToken}`,
        { signal: controller.signal }
      );

      strictEqual(response.status, 200);
      strictEqual(response.headers.get('content-type'), 'text/event-stream');
    } finally {
      controller.abort();
    }

    const response = await fetch(
      `${url}/mockoon-admin/logs?token=${testAdminApiToken}`
    );
    strictEqual(response.status, 401);
    await response.text();
  });
});
