import { promises as fs } from 'fs';
import environments from '../libs/environments';
import environmentsSettings from '../libs/environments-settings';
import http from '../libs/http';
import { HttpCall } from '../libs/models';
import navigation from '../libs/navigation';

const getCallMockoonCert: HttpCall = {
  description: 'Call GET answer',
  protocol: 'https',
  path: '/answer',
  method: 'GET',
  testedResponse: {
    body: '42',
    status: 200
  }
};

const getCallCustomCert: HttpCall = {
  description: 'Call GET answer',
  protocol: 'https',
  path: '/answer',
  method: 'GET',
  testedResponse: {
    body: '42',
    status: 200
  }
};

describe('TLS', () => {
  before(async () => {
    await fs.copyFile('./test/data/res/domain.crt', './tmp/storage/domain.crt');
    await fs.copyFile('./test/data/res/domain.key', './tmp/storage/domain.key');
  });

  it('should open and start the environment', async () => {
    await environments.open('proxy-1');
    await environments.start();
  });

  it('should call /answer and verify mockoon self-signed cert', async () => {
    await http.assertCallWithPort(getCallMockoonCert, 3000);
  });

  it('should add a custom certificate and use templating', async () => {
    await navigation.switchView('ENV_SETTINGS');
    await environmentsSettings.setSettingValue(
      'certPath',
      '{{getEnvVar "TLS_TEST_CERT_PATH"}}'
    );
    await environmentsSettings.setSettingValue(
      'keyPath',
      '{{getEnvVar "TLS_TEST_KEY_PATH"}}'
    );
    await environmentsSettings.setSettingValue(
      'passphrase',
      '{{getEnvVar "TLS_TEST_PASSPHRASE"}}'
    );
    await environments.restart();
  });

  it('should call /answer and verify the custom self-signed cert', async () => {
    await http.assertCallWithPort(getCallCustomCert, 3000);
  });
});
