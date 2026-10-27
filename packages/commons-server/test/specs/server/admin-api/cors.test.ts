import { Environment } from '@mockoon/commons';
import { strictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../../src';
import { getEnvironment } from '../../../libs/environment';
import { adminFetch, testAdminApiToken } from '../../../libs/utils';

describe('Admin API: CORS (no origins configured)', () => {
  let environment: Environment;
  let server: MockoonServer;
  const port = 3017;
  const url = `http://localhost:${port}`;

  before(async () => {
    environment = await getEnvironment('test');
    environment.port = port;
    server = new MockoonServer(environment, {
      adminApiAuthToken: testAdminApiToken
    });
    await new Promise((resolve, reject) => {
      server.on('started', () => resolve(true));
      server.on('error', (error) => reject(error));
      server.start();
    });
  });

  after(() => {
    server.stop();
  });

  it('should not emit CORS headers on regular requests', async () => {
    const response = await adminFetch(url, '/mockoon-admin', {
      headers: { Origin: 'https://malicious.example.com' }
    });

    strictEqual(response.status, 200);
    strictEqual(response.headers.get('access-control-allow-origin'), null);
    strictEqual(response.headers.get('access-control-allow-methods'), null);
  });

  it('should reject preflight (OPTIONS) requests with 403', async () => {
    const response = await fetch(`${url}/mockoon-admin/env-vars`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://malicious.example.com',
        'Access-Control-Request-Method': 'POST'
      }
    });

    strictEqual(response.status, 403);
    strictEqual(response.headers.get('access-control-allow-origin'), null);
  });
});

describe('Admin API: CORS (explicit allowlist)', () => {
  let environment: Environment;
  let server: MockoonServer;
  const port = 3018;
  const url = `http://localhost:${port}`;
  const allowedOrigin = 'https://app.example.com';

  before(async () => {
    environment = await getEnvironment('test');
    environment.port = port;
    server = new MockoonServer(environment, {
      adminApiAuthToken: testAdminApiToken,
      adminApiCorsOrigins: [allowedOrigin]
    });
    await new Promise((resolve, reject) => {
      server.on('started', () => resolve(true));
      server.on('error', (error) => reject(error));
      server.start();
    });
  });

  after(() => {
    server.stop();
  });

  it('should echo a matching origin and set Vary: Origin', async () => {
    const response = await adminFetch(url, '/mockoon-admin', {
      headers: { Origin: allowedOrigin }
    });

    strictEqual(response.status, 200);
    strictEqual(
      response.headers.get('access-control-allow-origin'),
      allowedOrigin
    );
    strictEqual(response.headers.get('vary'), 'Origin');
    strictEqual(
      response.headers.get('access-control-allow-methods'),
      'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS'
    );
  });

  it('should respond 204 to preflight from an allowed origin', async () => {
    const response = await fetch(`${url}/mockoon-admin/env-vars`, {
      method: 'OPTIONS',
      headers: {
        Origin: allowedOrigin,
        'Access-Control-Request-Method': 'POST'
      }
    });

    strictEqual(response.status, 204);
    strictEqual(
      response.headers.get('access-control-allow-origin'),
      allowedOrigin
    );
  });

  it('should not emit CORS headers for a non-allowed origin', async () => {
    const response = await adminFetch(url, '/mockoon-admin', {
      headers: { Origin: 'https://other.example.com' }
    });

    strictEqual(response.status, 200);
    strictEqual(response.headers.get('access-control-allow-origin'), null);
  });

  it('should reject preflight from a non-allowed origin with 403', async () => {
    const response = await fetch(`${url}/mockoon-admin/env-vars`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://other.example.com',
        'Access-Control-Request-Method': 'POST'
      }
    });

    strictEqual(response.status, 403);
    strictEqual(response.headers.get('access-control-allow-origin'), null);
  });
});

describe('Admin API: CORS (explicit wildcard opt-in)', () => {
  let environment: Environment;
  let server: MockoonServer;
  const port = 3019;
  const url = `http://localhost:${port}`;

  before(async () => {
    environment = await getEnvironment('test');
    environment.port = port;
    server = new MockoonServer(environment, {
      adminApiAuthToken: testAdminApiToken,
      adminApiCorsOrigins: ['*']
    });
    await new Promise((resolve, reject) => {
      server.on('started', () => resolve(true));
      server.on('error', (error) => reject(error));
      server.start();
    });
  });

  after(() => {
    server.stop();
  });

  it('should respond with wildcard Access-Control-Allow-Origin and no Vary header', async () => {
    const response = await adminFetch(url, '/mockoon-admin', {
      headers: { Origin: 'https://any.example.com' }
    });

    strictEqual(response.status, 200);
    strictEqual(response.headers.get('access-control-allow-origin'), '*');
    strictEqual(response.headers.get('vary'), null);
  });
});
