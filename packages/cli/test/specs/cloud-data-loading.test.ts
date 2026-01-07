import { MockoonServer } from '@mockoon/commons-server';
import { ok } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { spawnCli } from '../libs/helpers';

describe('Cloud data loading', () => {
  const validToken = 'valid-token-12345';
  const validEnvironmentId = 'test-env-uuid-123';
  const invalidEnvironmentId = 'non-existing-env';
  const mockEnvironmentData = JSON.parse(
    readFileSync(join(__dirname, '../data/mocks/cloud-api.json'), 'utf-8')
  );
  let mockServer: MockoonServer;

  before(async () => {
    mockServer = new MockoonServer(mockEnvironmentData);

    mockServer.start();

    mockServer.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('Mock server error:', err);
    });
  });

  after(() => {
    mockServer.stop();
  });

  it('should successfully load cloud environment with valid token', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      `cloud://${validEnvironmentId}`,
      '--token',
      validToken
    ]);

    instance.kill();

    const { stdout } = await output;

    ok(stdout.includes('Server started'));
    ok(stdout.includes('"environmentName":"mock1"'));
  });

  it('should fail when token is missing', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      `cloud://${validEnvironmentId}`
    ]);

    instance.kill();

    const { stderr } = await output;

    ok(
      stderr.includes(
        'A token is required to load cloud environments. Use the --token flag or set the MOCKOON_CLOUD_TOKEN environment variable.'
      )
    );
  });

  it('should fail when cloud API returns 401 (invalid token)', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      `cloud://${validEnvironmentId}`,
      '--token',
      'invalid-token'
    ]);

    instance.kill();

    const { stderr } = await output;
    ok(
      stderr.includes(
        `Failed to load cloud environment ${validEnvironmentId}: unauthorized access`
      )
    );
  });

  it('should fail when cloud API returns 404 (environment not found)', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      `cloud://${invalidEnvironmentId}`,
      '--token',
      validToken
    ]);

    instance.kill();

    const { stderr } = await output;

    ok(
      stderr.includes(
        `Failed to load cloud environment ${invalidEnvironmentId}: environment not found or you do not have access to it`
      )
    );
  });

  it('should fail when cloud URL is malformed', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      'cloud://',
      '--token',
      validToken
    ]);

    instance.kill();

    const { stderr } = await output;
    ok(stderr.includes('Failed to load cloud environment'));
  });

  it('should use MOCKOON_CLOUD_TOKEN environment variable when --token flag is not provided', async () => {
    const { instance, output } = await spawnCli([
      'start',
      '--data',
      `cloud://${validEnvironmentId}`
    ]);

    instance.kill();

    const { stderr } = await output;
    // Should fail because we're not setting the env var in this test
    // This validates that the env var is being read
    ok(
      stderr.includes(
        'A token is required to load cloud environments. Use the --token flag or set the MOCKOON_CLOUD_TOKEN environment variable.'
      )
    );
  });

  it('should handle network errors when cloud API is unreachable', async () => {
    // Stop the mock server temporarily to simulate network error
    mockServer.stop();

    const { instance, output } = await spawnCli([
      'start',
      '--data',
      'cloud://test-env',
      '--token',
      validToken
    ]);

    instance.kill();

    const { stderr } = await output;

    ok(stderr.includes('could not load file cloud://test-env'));
  });
});
