import { test } from '@oclif/test';
import axios from 'axios';
import { expect } from 'chai';

describe('Relative file path', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/file.json'])
    .do(async () => {
      const result = await axios.get('http://localhost:3000/file');

      expect(result.data).to.contain('filecontent');
    })
    .finally(() => {
      process.emit('SIGINT');
    })
    .it(
      'should start mock on port 3000 and call GET /file and get the file with a relative path from the environment file',
      (context) => {
        expect(context.stdout).to.contain('Server started');
      }
    );
});
