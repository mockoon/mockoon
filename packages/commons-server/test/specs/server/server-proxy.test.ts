import { Environment } from '@mockoon/commons';
import { deepEqual, equal } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../src';
import { getEnvironment } from '../../libs/environment';

describe('Server should handle proxy configuration', () => {
  let proxyEnv: Environment;
  let testEnv: Environment;
  let proxyServer: MockoonServer;
  let testServer: MockoonServer;

  before(async () => {
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

  it('Should not Proxy when route is present', async () => {
    const response = await fetch('http://localhost:3001/hard-route');
    equal(response.status, 200);

    const body = await response.json();
    deepEqual(body, { route: 'hard' });
  });

  it('Should proxy when route is not present', async () => {
    const response = await fetch('http://localhost:3001/test');
    equal(response.status, 200);

    const body = await response.json();
    deepEqual(body, {});
  });

  it('Should return response when request matches', async () => {
    const response = await fetch('http://localhost:3001/test2?rule=match');
    equal(response.status, 200);

    const body = await response.json();
    deepEqual(body, { route: 'match' });
  });

  it('Should proxy when request does not matches', async () => {
    const response = await fetch('http://localhost:3001/test2?rule=notmatch');
    equal(response.status, 200);

    const body = await response.json();
    deepEqual(body, { route: 'test2' });
  });
});
