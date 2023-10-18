import { Environment, ServerErrorCodes } from '@mockoon/commons';
import { expect } from 'chai';
import { MockoonServer } from '../../../src';
import { getEnvironment } from '../../libs/environment';

describe('Server should handle bad hostnames', () => {
  let environment: Environment;

  before(async () => {
    environment = await getEnvironment('test');
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
    environment.hostname = '192.168.1.255';

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
    environment = await getEnvironment('test');
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
