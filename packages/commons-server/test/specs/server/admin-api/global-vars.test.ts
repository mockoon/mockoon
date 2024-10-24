import { Environment } from '@mockoon/commons';
import fetch from 'node-fetch';
import { strictEqual } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../../src';
import { getEnvironment } from '../../../libs/environment';

describe('Admin API: global vars', () => {
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

  it('should set global variable using a GET endpoint from the mock', async () => {
    await fetch(`${url}/set-global-var`);

    strictEqual(await (await fetch(`${url}/get-global-var`)).text(), 'value1');
  });

  it("should get 404 if var doesn't exists", async () => {
    strictEqual(
      await (
        await fetch(`${url}/mockoon-admin/global-vars/UNKNOWN_NAME`)
      ).text(),
      '{"message":"Global variable not found"}'
    );
  });

  it('should get var from the system using admin GET route', async () => {
    strictEqual(
      await (await fetch(`${url}/mockoon-admin/global-vars/test`)).text(),
      '{"key":"test","value":"value1"}'
    );
  });

  it('should set global variable on POST to /mockoon-admin/global-vars', async () => {
    const key = 'test';
    const value = 'value2';
    const response = await fetch(`${url}/mockoon-admin/global-vars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    const body = await response.text();
    strictEqual(
      body,
      `{"message":"Global variable '${key}' has been set to '${value}'"}`
    );

    strictEqual(await (await fetch(`${url}/get-global-var`)).text(), 'value2');
  });

  it('should set global variable on PATCH to /mockoon-admin/global-vars', async () => {
    const key = 'test';
    const value = 'value3';
    const response = await fetch(`${url}/mockoon-admin/global-vars`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    const body = await response.text();
    strictEqual(
      body,
      `{"message":"Global variable '${key}' has been set to '${value}'"}`
    );

    strictEqual(await (await fetch(`${url}/get-global-var`)).text(), 'value3');
  });

  it('should set global variable on PUT to /mockoon-admin/global-vars', async () => {
    const key = 'test';
    const value = 'value4';
    const response = await fetch(`${url}/mockoon-admin/global-vars`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    const body = await response.text();
    strictEqual(
      body,
      `{"message":"Global variable '${key}' has been set to '${value}'"}`
    );
    strictEqual(await (await fetch(`${url}/get-global-var`)).text(), 'value4');
  });

  it('should purge global variables when POST request is made to /mockoon-admin/global-vars/purge', async () => {
    const response = await fetch(`${url}/mockoon-admin/global-vars/purge`, {
      method: 'POST'
    });
    const body = await response.text();
    strictEqual(body, '{"message":"Global variables have been purged"}');

    strictEqual(await (await fetch(`${url}/get-global-var`)).text(), '');
  });
});
