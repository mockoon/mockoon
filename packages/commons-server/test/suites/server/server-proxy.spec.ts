import { Environment } from '@mockoon/commons';
import { promises as fs } from 'fs';
import { MockoonServer } from '../../../src';
import AssertRequest from 'assert-request';

async function getEnvironment(name: string): Promise<Environment> {
  const environmentJson = await fs.readFile(
    `./test/data/environments/${name}-env.json`,
    'utf-8'
  );

  return JSON.parse(environmentJson) as Environment;
}

describe('Server should handle proxy configuration', () => {
  let proxyEnv: Environment;
  let testEnv: Environment;
  let proxyServer;
  let testServer;
  let request;

  before(async () => {
    proxyEnv = await getEnvironment('proxy');
    testEnv = await getEnvironment('test');
    proxyServer = new MockoonServer(proxyEnv);
    testServer = new MockoonServer(testEnv);
    testServer.start();
    proxyServer.start();
    request = AssertRequest('http://localhost:3001');
  });

  after(() => {
    testServer.stop();
    proxyServer.stop();
  });

  it('Should not Proxy when route is present', () =>
    request('/hard-route')
      .type('application/json')
      .json({ route: 'hard' })
      .okay());

  it('Should proxy when route is not present', () =>
    request('/test').type('application/json').json({}).okay());

  it('Should return response when request matches', () =>
    request('/test2?rule=match')
      .type('application/json')
      .json({ route: 'match' })
      .okay());

  it('Should proxy when request does not matches', () =>
    request('/test2?rule=notmatch')
      .type('application/json')
      .json({ route: 'test2' })
      .okay());
});
