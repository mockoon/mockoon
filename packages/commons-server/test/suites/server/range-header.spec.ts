import { Environment } from '@mockoon/commons';
import { expect } from 'chai';
import { MockoonServer } from '../../../src';
import { getEnvironment } from '../../libs/environment';

const chai = require('chai');
const spies = require('chai-spies');

chai.use(spies);

describe('Range headers', () => {
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

      server.on('error', (error, oe) => {
        reject(error);
      });

      server.start();
    });
  });

  after(() => {
    server.stop();
  });

  it('should return 400 when Range header is malformed', async () => {
    const response = await fetch('http://localhost:3010/file', {
      headers: {
        Range: 'bytes0-5'
      }
    });
    const body = await response.text();

    expect(response.status).to.equal(400);
    expect(body).to.equal('Malformed range header');
  });

  it('should return 416 when Range header is unsatisfiable', async () => {
    const response = await fetch('http://localhost:3010/file', {
      headers: {
        Range: 'bytes=5000-5005'
      }
    });
    const body = await response.text();

    expect(response.status).to.equal(416);
    expect(body).to.equal('Requested range not satisfiable');
  });

  it('should handle correct range headers', async () => {
    const response = await fetch('http://localhost:3010/file', {
      headers: {
        Range: 'bytes=0-5'
      }
    });
    const body = await response.text();

    // 206 Partial Content
    expect(response.status).to.equal(206);
    // assuming the server should respond with the first 5 bytes of a 1234-byte file
    expect(response.headers.get('Content-Range')).to.equal('bytes 0-5/144');
    expect(response.headers.get('Accept-Ranges')).to.equal('bytes');
    expect(response.headers.get('Content-Length')).to.equal('6');

    expect(body).to.equal('abcdef');
  });
});
