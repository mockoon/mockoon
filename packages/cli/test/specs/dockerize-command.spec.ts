import { test } from '@oclif/test';
import { ok, strictEqual } from 'assert';
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
      ok(
        dockerfileContent.includes(
          `RUN npm install -g @mockoon/cli@${Config.version}`
        )
      );
      ok(dockerfileContent.includes('COPY ./mock1.json ./mock1.json'));
      ok(
        dockerfileContent.includes('COPY ./mock1noext.json ./mock1noext.json')
      );
      ok(
        dockerfileContent.includes(
          'COPY ./generate-mock-data.json ./generate-mock-data.json'
        )
      );
      ok(
        dockerfileContent.includes(
          'ENTRYPOINT ["mockoon-cli","start","--disable-log-to-file","--data","./mock1.json","./mock1noext.json","./generate-mock-data.json","--port","3010","3011","3012","--log-transaction"]'
        )
      );
      ok(dockerfileContent.includes('EXPOSE 3010 3011 3012'));
    })
    .do(async () => {
      // verify mock files are copied
      strictEqual(existsSync('./tmp/mock1.json'), true);
      strictEqual(existsSync('./tmp/mock1noext.json'), true);
      strictEqual(existsSync('./tmp/generate-mock-data.json'), true);
    })
    .it('should successfully run the command', (context) => {
      console.log(context.stdout);
      ok(context.stdout.includes('Dockerfile was generated and saved to'));
      ok(context.stdout.includes('docker build -t mockoon-image .'));
      ok(
        context.stdout.includes(
          'docker run -d -p 3010:3010 -p 3011:3011 -p 3012:3012 mockoon-image'
        )
      );
    });
});
