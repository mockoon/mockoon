import { expect } from 'chai';
import * as os from 'os';
import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

const endpointCall: HttpCall = {
  description: 'Call GET /test',
  path: '/test',
  method: 'GET',
  body: 'requestbody',
  testedResponse: {
    body: 'Response',
    status: 200
  }
};

describe('Environment answers on all hostnames', async () => {
  const tests = new Tests('environment-hostname-restriction/all');

  it('Start default environment', async () => {
    await tests.helpers.startEnvironment();
  });

  it(endpointCall.description, async () => {
    await tests.helpers.httpCallAsserter(endpointCall);
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
    for (const address of nics[nicType]) {
      if (address.family !== 'IPv4') {
        continue;
      }

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
  const tests = new Tests('environment-hostname-restriction/localhost');

  it('Start default environment', async () => {
    await tests.helpers.startEnvironment();
  });

  it(endpointCall.description, async () => {
    await tests.helpers.httpCallAsserter(endpointCall);
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
    for (const address of nics[nicType]) {
      if (address.family !== 'IPv4') {
        continue;
      }

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
