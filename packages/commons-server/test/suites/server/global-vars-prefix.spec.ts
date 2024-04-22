import { Environment } from '@mockoon/commons';
import { strictEqual } from 'assert';
import { after, before, describe, it } from 'mocha';
import fetch from 'node-fetch';
import { MockoonServer } from '../../../src';
import { getEnvironment } from '../../libs/environment';

describe('Admin API Endpoints', () => {
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

  it('should purge the state when PURGE request is made to /mockoon-admin/state', async () => {
    const response = await fetch(
      `http://localhost:${environment.port}/mockoon-admin/state`,
      { method: 'PURGE' }
    );
    const body = await response.text();
    strictEqual(body, '{"response":"State purged successfully."}');
  });

  it('should set global variable on POST to /mockoon-admin/global-vars', async () => {
    const key = 'exampleKey';
    const value = 'exampleValue';
    const response = await fetch(
      `http://localhost:${environment.port}/mockoon-admin/global-vars`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      }
    );
    const body = await response.text();
    strictEqual(
      body,
      `{"message":"Global variable ${key} has been set to ${value}."}`
    );
  });

  it('should purge global variables when PURGE request is made to /mockoon-admin/global-vars', async () => {
    const response = await fetch(
      `http://localhost:${environment.port}/mockoon-admin/global-vars`,
      { method: 'PURGE' }
    );
    const body = await response.text();
    strictEqual(body, '{"message":"Global variables have been purged."}');
  });

  // Test for PURGE existing endpoint
  it('should purge the state when POST request is made to /mockoon-admin/state/purge', async () => {
    const response = await fetch(
      `http://localhost:${environment.port}/mockoon-admin/state/purge`,
      { method: 'POST' }
    );
    const body = await response.text();
    strictEqual(body, '{"response":"State purged successfully."}');
  });

  // Tests for PUT and PATCH at /mockoon-admin/global-vars
  it('should update global variable on PUT', async () => {
    const key = 'updateKey';
    const value = 'updatedValue';
    const response = await fetch(
      `http://localhost:${environment.port}/mockoon-admin/global-vars`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      }
    );
    const body = await response.text();
    strictEqual(
      body,
      `{"message":"Global variable ${key} has been set to ${value}."}`
    );
  });

  it('should partially update global variable on PATCH', async () => {
    const key = 'patchKey';
    const value = 'patchedValue';
    const response = await fetch(
      `http://localhost:${environment.port}/mockoon-admin/global-vars`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      }
    );
    const body = await response.text();
    strictEqual(
      body,
      `{"message":"Global variable ${key} has been set to ${value}."}`
    );
  });

  // Test for additional purge functionality
  it('should purge global variables when POST request is made to /mockoon-admin/global-vars/purge', async () => {
    const response = await fetch(
      `http://localhost:${environment.port}/mockoon-admin/global-vars/purge`,
      { method: 'POST' }
    );
    const body = await response.text();
    strictEqual(body, '{"message":"Global variables have been purged."}');
  });
});
