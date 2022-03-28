import { test } from '@oclif/test';
import axios from 'axios';
import { expect } from 'chai';
import { stopProcesses } from '../libs/helpers';

describe('Relative file path', () => {
  test
    .stdout()
    .command(['start', '--data', './test/data/envs/file.json'])
    .it('should start mock on port 3000', (context) => {
      expect(context.stdout).to.contain(
        'Mock started at http://localhost:3000 (pid: 0, name: mockoon-environment-file)'
      );
    });

  test.it(
    'should call GET /file and get the file with a relative path from the environment file',
    async () => {
      const result = await axios.get('http://localhost:3000/file');

      expect(result.data).to.contain('filecontent');
    }
  );

  stopProcesses('all', ['mockoon-environment-file']);
});
