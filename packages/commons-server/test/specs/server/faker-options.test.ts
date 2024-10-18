import { Environment } from '@mockoon/commons';
import AssertRequest from 'assert-request';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../src';
import { getEnvironment } from '../../libs/environment';

describe('Server should follow Faker.js options', () => {
  let testEnv: Environment;
  let testServer: MockoonServer;
  let request;

  before(async () => {
    testEnv = await getEnvironment('test');
    testServer = new MockoonServer(testEnv, {
      fakerOptions: {
        seed: 1,
        locale: 'en_GB'
      },
      envVarsPrefix: ''
    });
    testServer.start();
    request = AssertRequest('http://localhost:3000');
  });

  after(() => {
    testServer.stop();
  });

  it('should return seeding and localized content', () =>
    request('/faker').body('ZS9 0DH').okay());
});
