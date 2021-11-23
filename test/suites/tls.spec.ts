import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

const getCallMockoonCert: HttpCall = {
  description: 'Call GET answer',
  protocol: 'https',
  path: '/answer',
  method: 'GET',
  testedResponse: {
    body: '42',
    status: 200,
    cert: {
      issuer: {
        C: 'AU',
        CN: 'localhost',
        O: 'Internet Widgits Pty Ltd',
        ST: 'Some-State'
      }
    }
  }
};

const getCallCustomCert: HttpCall = {
  description: 'Call GET answer',
  protocol: 'https',
  path: '/answer',
  method: 'GET',
  testedResponse: {
    body: '42',
    status: 200,
    cert: {
      issuer: {
        CN: 'localhost',
        O: 'mockoon'
      }
    }
  }
};

describe('TLS', () => {
  const tests = new Tests('proxy');

  it('should start the environment', async () => {
    await tests.helpers.selectEnvironment(1);
    await tests.helpers.startEnvironment();
  });

  it('should call /answer and verify mockoon self-signed cert', async () => {
    await tests.helpers.httpCallAsserterWithPort(getCallMockoonCert, 3000);
  });

  it('should add a custom certificate', async () => {
    await tests.helpers.switchView('ENV_SETTINGS');

    await tests.helpers.setElementValue(
      'input[formcontrolname="certPath"]',
      '../../test/data/domain.crt'
    );
    await tests.helpers.setElementValue(
      'input[formcontrolname="keyPath"]',
      '../../test/data/domain.key'
    );
    await tests.helpers.setElementValue(
      'input[formcontrolname="passphrase"]',
      '123456'
    );
    await tests.helpers.restartEnvironment();
  });

  it('should call /answer and verify the custom self-signed cert', async () => {
    await tests.helpers.httpCallAsserterWithPort(getCallCustomCert, 3000);
  });
});
