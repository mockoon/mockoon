import { existsSync } from 'fs';
import { ok, strictEqual } from 'node:assert';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { Config } from '../../src/config';
import { spawnCli } from '../libs/helpers';

describe('Dockerize command', () => {
  before(async () => {
    await mkdir('./tmp', { recursive: true });
  });

  after(async () => {
    await rm('./tmp', { recursive: true });
  });

  it('should import from JSON file', async () => {
    const { output } = await spawnCli([
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
    ]);

    // verify Dockerfile content
    const dockerfile = await readFile('./tmp/Dockerfile');
    const dockerfileContent = dockerfile.toString();
    ok(
      dockerfileContent.includes(
        `RUN npm install -g @mockoon/cli@${Config.version}`
      )
    );
    ok(dockerfileContent.includes('COPY ./mock1.json ./mock1.json'));
    ok(dockerfileContent.includes('COPY ./mock1noext.json ./mock1noext.json'));
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

    // verify mock files are copied
    strictEqual(existsSync('./tmp/mock1.json'), true);
    strictEqual(existsSync('./tmp/mock1noext.json'), true);
    strictEqual(existsSync('./tmp/generate-mock-data.json'), true);

    const { stdout } = await output;

    ok(stdout.includes('Dockerfile was generated and saved to'));
    ok(stdout.includes('docker build -t mockoon-image .'));
    ok(
      stdout.includes(
        'docker run -d -p 3010:3010 -p 3011:3011 -p 3012:3012 mockoon-image'
      )
    );
  });
});
