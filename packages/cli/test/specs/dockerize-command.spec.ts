import { test } from '@oclif/test';
import { expect } from 'chai';
import { existsSync, promises as fs } from 'fs';
import { Config } from '../../src/config';

describe('Dockerize command', () => {
  test
    .stdout()
    .command([
      'dockerize',
      '--log-transaction',
      '--data',
      './test/data/envs/mock1.json',
      './test/data/envs/mock1noext',
      'https://raw.githubusercontent.com/mockoon/mock-samples/main/samples/generate-mock-data.json',
      '--port',
      '3010',
      '3011',
      '3012',
      '--output',
      './tmp/Dockerfile'
    ])
    .do(async () => {
      // verify Dockerfile content
      const dockerfile = await fs.readFile('./tmp/Dockerfile');
      const dockerfileContent = dockerfile.toString();
      expect(dockerfileContent).to.contain(
        `RUN npm install -g @mockoon/cli@${Config.version}`
      );
      expect(dockerfileContent).to.contain('COPY ./mock1.json ./mock1.json');
      expect(dockerfileContent).to.contain(
        'COPY ./mock1noext.json ./mock1noext.json'
      );
      expect(dockerfileContent).to.contain(
        'COPY ./generate-mock-data.json ./generate-mock-data.json'
      );
      expect(dockerfileContent).to.contain(
        'ENTRYPOINT ["mockoon-cli","start","--disable-log-to-file","--data","./mock1.json","./mock1noext.json","./generate-mock-data.json","--port","3010","3011","3012","--log-transaction"]'
      );
      expect(dockerfileContent).to.contain('EXPOSE 3010 3011 3012');
    })
    .do(async () => {
      // verify mock files are copied
      expect(existsSync('./tmp/mock1.json')).to.equal(true);
      expect(existsSync('./tmp/mock1noext.json')).to.equal(true);
      expect(existsSync('./tmp/generate-mock-data.json')).to.equal(true);
    })
    .it('should successfully run the command', (context) => {
      console.log(context.stdout);
      expect(context.stdout).to.contain(
        'Dockerfile was generated and saved to'
      );
      expect(context.stdout).to.contain('docker build -t mockoon-image .');
      expect(context.stdout).to.contain(
        'docker run -d -p 3010:3010 -p 3011:3011 -p 3012:3012 mockoon-image'
      );
    });
});
