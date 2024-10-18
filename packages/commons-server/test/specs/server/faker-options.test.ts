import { Environment } from '@mockoon/commons';
import { equal } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../src';
import { getEnvironment } from '../../libs/environment';

describe('Server should follow Faker.js options', () => {
  let testEnv: Environment;
  let testServer: MockoonServer;

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
  });

  after(() => {
    testServer.stop();
  });

  it('should return seeding and localized content', async () => {
    const response = await fetch('http://localhost:3000/faker');
    const body = await response.text();

    equal(body, 'SA3 1CE');
  });
});
