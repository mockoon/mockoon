import { test } from '@oclif/test';
import { expect } from 'chai';

describe('Start command', () => {
  test
    .stderr()
    .command(['start'])
    .catch((context) => {
      expect(context.message).to.contain('Missing required flag:');
      expect(context.message).to.contain('-d, --data DATA');
    })
    .it('should fail when data flag is missing');

  test
    .stderr()
    .command([
      'start',
      '--data',
      './test/data/envs/mock1.json',
      '--port',
      '999999'
    ])
    .catch((context) => {
      expect(context.message).to.contain('Port "999999" is invalid');
    })
    .it('should fail when a port is invalid');
});
