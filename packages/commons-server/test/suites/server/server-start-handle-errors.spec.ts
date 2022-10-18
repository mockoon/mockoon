import { Environment, ServerErrorCodes } from '@mockoon/commons';
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { MockoonServer } from '../../../src';

async function getEnvironment(): Promise<Environment> {
  const environmentJson = await fs.readFile(
    './test/data/environments/test-env.json',
    'utf-8'
  );

  return JSON.parse(environmentJson) as Environment;
}

describe('Server should handle bad hostnames', () => {
  let environment: Environment;

  before(async () => {
    environment = await getEnvironment();
  });

  it('Malformed IP address', (done) => {
    environment.hostname = '1922.0.0.1';
    const server = new MockoonServer(environment);
    server.on('error', (errorCode) => {
      expect(errorCode).to.equal(ServerErrorCodes.HOSTNAME_UNKNOWN);
      server.stop();
      done();
    });

    server.start();
  });

  it('Unavailable IP Address', (done) => {
    environment.hostname = '192.168.0.255';

    const server = new MockoonServer(environment);
    server.on('error', (errorCode) => {
      expect(errorCode).to.equal(ServerErrorCodes.HOSTNAME_UNAVAILABLE);
      server.stop();
      done();
    });

    server.start();
  });
});

describe('Server should handle port errors', () => {
  let environment: Environment;

  before(async () => {
    environment = await getEnvironment();
  });

  it('Port in use', (done) => {
    environment.port = 3000;

    const server = new MockoonServer(environment);
    const server1 = new MockoonServer(environment);
    server1.start();
    server.on('error', (errorCode) => {
      expect(errorCode).to.equal(ServerErrorCodes.PORT_ALREADY_USED);
      server1.stop();
      server.stop();
      done();
    });

    server.start();
  });
});
