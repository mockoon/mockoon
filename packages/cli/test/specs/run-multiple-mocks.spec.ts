import { test } from '@oclif/test';
import axios from 'axios';
import { expect } from 'chai';

describe('Run two mocks on different ports', () => {
  test
    .stdout()
    .command([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      './test/data/envs/mock2.json',
      '--port',
      '3000',
      '3001'
    ])
    .do(async () => {
      const call1 = await axios.get('http://localhost:3000/api/test');
      const call2 = await axios.get('http://localhost:3001/api/test');

      expect(call1.data).to.contain('mock-content-1');
      expect(call2.data).to.contain('mock-content-2');
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start first mock on port 3000 and call GET /api/test endpoints and get a result',
      (context) => {
        expect(context.stdout).to.contain('Server started on port 3000');
        expect(context.stdout).to.contain('Server started on port 3001');
      }
    );
});

describe('Run same mock twice on different ports', () => {
  test
    .stdout()
    .command([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      './test/data/envs/mock1.json',
      '--port',
      '3000',
      '3001'
    ])
    .do(async () => {
      const call1 = await axios.get('http://localhost:3000/api/test');
      const call2 = await axios.get('http://localhost:3001/api/test');

      expect(call1.data).to.contain('mock-content-1');
      expect(call2.data).to.contain('mock-content-1');
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start first mock on port 3000 and call GET /api/test endpoints and get a result',
      (context) => {
        expect(context.stdout).to.contain('Server started on port 3000');
        expect(context.stdout).to.contain('Server started on port 3001');
      }
    );
});
