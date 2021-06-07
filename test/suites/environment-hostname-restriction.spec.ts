import { expect } from 'chai';
import * as os from 'os';
import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

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

describe('Environment hostname restriction', async () => {
  describe('Environment answers on all hostnames', async () => {
    const tests = new Tests('basic-data');

    it('Start default environment', async () => {
      await tests.helpers.startEnvironment();
    });

    const nics = os.networkInterfaces();

    const testedNicTypes = ['wi-fi', 'ethernet'];

    it('Answers on localhost', async () => {
      await tests.helpers.httpCallAssertWithPortAndHostname(
        endpointCall,
        3000,
        'localhost'
      );
    });

    it('Answers on 127.0.0.1', async () => {
      await tests.helpers.httpCallAssertWithPortAndHostname(
        endpointCall,
        3000,
        '127.0.0.1'
      );
    });

    for (const nicType in nics) {
      if (testedNicTypes.indexOf(nicType.toLowerCase()) === -1) {
        continue;
      }

      for (const address of nics[nicType].filter((f) => f.family === 'IPv4')) {
        it(`Answers on ${address.address}`, async () => {
          await tests.helpers.httpCallAssertWithPortAndHostname(
            endpointCall,
            3000,
            address.address
          );
        });
      }
    }
  });

  describe('Environment answers on localhost only', async () => {
    const tests = new Tests('basic-data');

    it('Switch localhost only and start default environment', async () => {
      await tests.helpers.switchViewInHeader('ENV_SETTINGS');
      await tests.helpers.elementClick(
        'input[formControlName="localhostOnly"]'
      );
      await tests.helpers.startEnvironment();
    });

    it('Answers on localhost', async () => {
      await tests.helpers.httpCallAssertWithPortAndHostname(
        endpointCall,
        3000,
        'localhost'
      );
    });

    it('Answers on 127.0.0.1', async () => {
      await tests.helpers.httpCallAssertWithPortAndHostname(
        endpointCall,
        3000,
        '127.0.0.1'
      );
    });

    const nics = os.networkInterfaces();

    const testedNicTypes = ['wi-fi', 'ethernet'];

    for (const nicType in nics) {
      if (testedNicTypes.indexOf(nicType.toLowerCase()) === -1) {
        continue;
      }

      for (const address of nics[nicType].filter((a) => a.family === 'IPv4')) {
        it(`Does not answer on ${address.address}`, async () => {
          await expect(
            tests.helpers.httpCallAssertWithPortAndHostname(
              endpointCall,
              3000,
              address.address
            )
          ).to.be.rejectedWith(Error);
        });
      }
    }
  });
});
