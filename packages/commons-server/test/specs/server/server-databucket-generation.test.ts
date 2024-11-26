import { Environment } from '@mockoon/commons';
import { equal } from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { MockoonServer } from '../../../src';
import { getEnvironment } from '../../libs/environment';

describe('Server databuckets generation', () => {
  let environment: Environment;
  let server: MockoonServer;

  before(async () => {
    environment = await getEnvironment('test');
    environment.port = 3010;
    environment.data = [];
    // add a databucket without a request helper
    environment.data.push({
      documentation: '',
      id: 'test1',
      name: 'test1',
      value: '{{uuid}}',
      uuid: 'de68aa87-782a-4c20-8804-96ed5ef7d5f6'
    });

    // add databuckets with a request helper
    environment.data.push({
      documentation: '',
      id: 'test2',
      name: 'test2',
      value: '{{#each (urlParam) }}',
      uuid: '0c987f00-6b09-433b-834c-4040ec47170f'
    });
    environment.data.push({
      documentation: '',
      id: 'test3',
      name: 'test3',
      value: '{{~#each   ( urlParam ) ~}}',
      uuid: 'be4fd790-f37b-441e-8fe8-05e061ec19b5'
    });
    environment.data.push({
      documentation: '',
      id: 'test4',
      name: 'test4',
      value: '{{ip~}}',
      uuid: '100f4310-b81c-474d-946f-82843c78ef22'
    });
    environment.data.push({
      documentation: '',
      id: 'test5',
      name: 'test5',
      value: '{{ip}}',
      uuid: '6811019d-7ea2-416a-af1a-4b5afda05a89'
    });
    environment.data.push({
      documentation: '',
      id: 'test6',
      name: 'test6',
      value: '{{ ip ~}}',
      uuid: 'a4c2714b-e3cd-47dc-86ff-61e745ba72ce'
    });
    environment.data.push({
      documentation: '',
      id: 'test7',
      name: 'test7',
      value: '{{ (ip) ~}}',
      uuid: '0d59474b-8f95-4889-9ddf-085e8d138873'
    });
    environment.data.push({
      documentation: '',
      id: 'test8',
      name: 'test8',
      value: '{{ ( ip ) }}',
      uuid: '90c0a3dd-476f-47a0-be2d-1d320c6140d4'
    });
    environment.data.push({
      documentation: '',
      id: 'test9',
      name: 'test9',
      value: '{{~(ip)~}}',
      uuid: 'fbf47b69-d8ef-4817-8132-2b152a203b0f'
    });
    environment.data.push({
      documentation: '',
      id: 'test10',
      name: 'test10',
      value: '{{eq (urlParam)}}',
      uuid: '09334382-7168-4c60-98ea-2f155b1b427b'
    });
    environment.data.push({
      documentation: '',
      id: 'test11',
      name: 'test11',
      value: '{{ zipcode}}',
      uuid: '81c93195-8393-4646-9aaa-7bab331d6ff8'
    });
    environment.data.push({
      documentation: '',
      id: 'test12',
      name: 'test12',
      value: '{{#each zipcode }}',
      uuid: '65a5878e-f25f-431b-b04e-634a07b2b136'
    });
  });

  it("should generate databucket when it doesn't contain a request helper", (context, done) => {
    server = new MockoonServer(environment);

    server.on('started', () => {
      equal(server.getProcessedDatabucket('test1')?.parsed, true);
      equal(server.getProcessedDatabucket('test2')?.parsed, false);
      equal(server.getProcessedDatabucket('test3')?.parsed, false);
      equal(server.getProcessedDatabucket('test4')?.parsed, false);
      equal(server.getProcessedDatabucket('test5')?.parsed, false);
      equal(server.getProcessedDatabucket('test6')?.parsed, false);
      equal(server.getProcessedDatabucket('test7')?.parsed, false);
      equal(server.getProcessedDatabucket('test8')?.parsed, false);
      equal(server.getProcessedDatabucket('test9')?.parsed, false);
      equal(server.getProcessedDatabucket('test10')?.parsed, false);
      equal(server.getProcessedDatabucket('test11')?.parsed, true);
      equal(server.getProcessedDatabucket('test12')?.parsed, true);
      server.stop();
      done();
    });

    server.start();
  });

  after(() => {
    server.stop();
  });
});
