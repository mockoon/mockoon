import * as os from 'os';
import environments from '../libs/environments';
import environmentsSettings from '../libs/environments-settings';
import http from '../libs/http';
import { HttpCall } from '../libs/models';
import navigation from '../libs/navigation';

const endpointCall: HttpCall = {
  description: 'Call GET /answer',
  path: '/answer',
  method: 'GET',
  body: 'requestbody',
  testedResponse: {
    body: '42',
    status: 200
  }
};
const nics = os.networkInterfaces();
const testedAddresses = [];

for (const nicName in nics) {
  if (nicName.toLowerCase().includes('ethernet')) {
    for (const adapter of nics[nicName].filter((f) => f.family === 'IPv4')) {
      testedAddresses.push(adapter.address);
    }
  }
}

describe('Environment hostname restriction', async () => {
  describe('Environment answers on all hostnames', async () => {
    it('should open and start the environment', async () => {
      await environments.open('basic-data');
      await environments.start();
    });

    it('should answers on localhost', async () => {
      await http.assertCallWithPortAndHostname(endpointCall, 3000, 'localhost');
    });

    it('should answers on 127.0.0.1', async () => {
      await http.assertCallWithPortAndHostname(endpointCall, 3000, '127.0.0.1');
    });

    testedAddresses.forEach((address) => {
      it(`should answers on ${address}`, async () => {
        await http.assertCallWithPortAndHostname(endpointCall, 3000, address);
      });
    });
  });

  describe('Environment answers on localhost only', async () => {
    it('should switch to localhost only and start default environment', async () => {
      await navigation.switchView('ENV_SETTINGS');
      await environmentsSettings.toggleSetting('localhostOnly');
      await environments.restart();
    });

    it('should answers on localhost', async () => {
      await http.assertCallWithPortAndHostname(endpointCall, 3000, 'localhost');
    });

    it('should answers on 127.0.0.1', async () => {
      await http.assertCallWithPortAndHostname(endpointCall, 3000, '127.0.0.1');
    });

    testedAddresses.forEach((address) => {
      it(`shouldn't answer on ${address}`, async () => {
        try {
          await http.assertCallWithPortAndHostname(endpointCall, 3000, address);
        } catch (error) {
          await expect(error.message).toContain('ECONNREFUSED');
        }
      });
    });
  });
});
