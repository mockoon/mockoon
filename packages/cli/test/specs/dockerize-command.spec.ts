import { Environment } from '@mockoon/commons';
import { test } from '@oclif/test';
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { readFile as readJSONFile } from 'jsonfile';
import { Config } from '../../src/config';

describe('Dockerize command', () => {
  describe('Dockerize single mock', () => {
    test
      .stdout()
      .command([
        'dockerize',
        '--data',
        './test/data/envs/mock1.json',
        '--port',
        '3010',
        '--output',
        './tmp/Dockerfile'
      ])
      .it('should successfully run the command', (context) => {
        expect(context.stdout).to.contain(
          'Dockerfile was generated and saved to /home/runner/work/mockoon/mockoon/packages/cli/tmp/Dockerfile'
        );
        expect(context.stdout).to.contain(
          'cd /home/runner/work/mockoon/mockoon/packages/cli/tmp'
        );
        expect(context.stdout).to.contain('docker build -t mockoon-mock1 .');
        expect(context.stdout).to.contain(
          'docker run -d -p 3010:3010 mockoon-mock1'
        );
      });

    test.it(
      'should generate the Dockerfile with the correct content',
      async () => {
        const dockerfile = await fs.readFile('./tmp/Dockerfile');
        const dockerfileContent = dockerfile.toString();
        expect(dockerfileContent).to.contain(
          `RUN npm install -g @mockoon/cli@${Config.version}`
        );
        expect(dockerfileContent).to.contain(
          'COPY mockoon-mock1.json ./mockoon-mock1.json'
        );
        expect(dockerfileContent).to.contain(
          'ENTRYPOINT ["mockoon-cli", "start", "--daemon-off", "--data", "mockoon-mock1.json", "--container"]'
        );
        expect(dockerfileContent).to.contain('EXPOSE 3010');
      }
    );

    test.it(
      'should generate mock JSON file next to the Dockerfile',
      async () => {
        const mockFile: Environment = await readJSONFile(
          './tmp/mockoon-mock1.json',
          'utf-8'
        );
        expect(mockFile.name).to.equal('mockoon-mock1');
        expect(mockFile.port).to.equal(3010);
      }
    );
  });

  describe('Dockerize multiple mocks', () => {
    test
      .stdout()
      .command([
        'dockerize',
        '--data',
        './test/data/envs/mock1.json',
        './test/data/envs/mock2.json',
        '--port',
        '3010',
        '3011',
        '--output',
        './tmp/Dockerfile'
      ])
      .it('should successfully run the command', (context) => {
        expect(context.stdout).to.contain(
          'Dockerfile was generated and saved to /home/runner/work/mockoon/mockoon/packages/cli/tmp/Dockerfile'
        );
        expect(context.stdout).to.contain(
          'cd /home/runner/work/mockoon/mockoon/packages/cli/tmp'
        );
        expect(context.stdout).to.contain('docker build -t mockoon-mocks .');
        expect(context.stdout).to.contain(
          'docker run -d -p 3010:3010 -p 3011:3011 mockoon-mocks'
        );
      });

    test.it(
      'should generate the Dockerfile with the correct content',
      async () => {
        const dockerfile = await fs.readFile('./tmp/Dockerfile');
        const dockerfileContent = dockerfile.toString();
        expect(dockerfileContent).to.contain(
          `RUN npm install -g @mockoon/cli@${Config.version}`
        );
        expect(dockerfileContent).to.contain(
          'COPY mockoon-mock1.json ./mockoon-mock1.json'
        );
        expect(dockerfileContent).to.contain(
          'COPY mockoon-mock2.json ./mockoon-mock2.json'
        );
        expect(dockerfileContent).to.contain(
          'ENTRYPOINT ["mockoon-cli", "start", "--daemon-off", "--data", "mockoon-mock1.json", "mockoon-mock2.json", "--container"]'
        );
        expect(dockerfileContent).to.contain('EXPOSE 3010 3011');
      }
    );

    test.it(
      'should generate mock JSON file next to the Dockerfile',
      async () => {
        const mockFile1: Environment = await readJSONFile(
          './tmp/mockoon-mock1.json',
          'utf-8'
        );
        expect(mockFile1.name).to.equal('mockoon-mock1');
        expect(mockFile1.port).to.equal(3010);

        const mockFile2: Environment = await readJSONFile(
          './tmp/mockoon-mock2.json',
          'utf-8'
        );
        expect(mockFile2.name).to.equal('mockoon-mock2');
        expect(mockFile2.port).to.equal(3011);
      }
    );
  });
});
