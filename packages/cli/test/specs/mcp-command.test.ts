import { ok, strictEqual } from 'node:assert';
import { resolve } from 'node:path';
import { after, describe, it } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Creates and connects an MCP Client to the CLI running in MCP mode.
 */
const createClient = async (): Promise<Client> => {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./bin/dev.js', 'mcp']
  });

  const client = new Client(
    { name: 'test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);

  return client;
};

describe('MCP command', () => {
  after(async () => {
    // Give time for any lingering child processes to exit
    await new Promise((res) => setTimeout(res, 200));
  });

  it('should respond to initialize with server info', async () => {
    const client = await createClient();

    try {
      const info = client.getServerVersion();

      strictEqual(info?.name, 'mockoon');
    } finally {
      await client.close();
    }
  });

  it('should list available tools', async () => {
    const client = await createClient();

    try {
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name);

      ok(names.includes('list_mocks'));
      ok(names.includes('start_mock'));
      ok(names.includes('stop_mock'));
      ok(names.includes('list_running_mocks'));
    } finally {
      await client.close();
    }
  });

  it('should list mocks', async () => {
    const client = await createClient();

    try {
      const result = await client.callTool({ name: 'list_mocks', arguments: {} });

      ok(!result.isError);
      ok(
        Array.isArray(result.content) &&
          result.content[0]?.type === 'text'
      );
    } finally {
      await client.close();
    }
  });

  it('should start a mock server via start_mock', async () => {
    const client = await createClient();

    try {
      const result = await client.callTool({
        name: 'start_mock',
        arguments: { data: resolve('./test/data/envs/mock1.json') }
      });

      ok(!result.isError);
      ok(
        Array.isArray(result.content) &&
          (result.content[0] as any)?.text?.includes('started on port')
      );
    } finally {
      await client.close();
    }
  });

  it('should return an error for a non-existent data file via start_mock', async () => {
    const client = await createClient();

    try {
      const result = await client.callTool({
        name: 'start_mock',
        arguments: { data: resolve('./test/data/envs/nonexistent.json') }
      });

      strictEqual(result.isError, true);
      ok(
        Array.isArray(result.content) &&
          (result.content[0] as any)?.text?.includes('Failed to start')
      );
    } finally {
      await client.close();
    }
  });

  it('should return an error when starting an already running mock', async () => {
    const client = await createClient();

    try {
      await client.callTool({
        name: 'start_mock',
        arguments: { data: resolve('./test/data/envs/mock2.json') }
      });

      const result = await client.callTool({
        name: 'start_mock',
        arguments: { data: resolve('./test/data/envs/mock2.json') }
      });

      strictEqual(result.isError, true);
      ok(
        Array.isArray(result.content) &&
          (result.content[0] as any)?.text?.includes('already running')
      );
    } finally {
      await client.close();
    }
  });

  it('should stop a running mock via stop_mock', async () => {
    const client = await createClient();

    try {
      await client.callTool({
        name: 'start_mock',
        arguments: { data: resolve('./test/data/envs/mock2.json') }
      });

      const running = await client.callTool({
        name: 'list_running_mocks',
        arguments: {}
      });

      ok(!running.isError);

      const text = ((running.content as any[])[0] as any)?.text as string;
      const uuidMatch = text.match(
        /\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]/
      );

      ok(uuidMatch, 'UUID not found in list_running_mocks output');

      const stopResult = await client.callTool({
        name: 'stop_mock',
        arguments: { uuid: uuidMatch[1] }
      });

      ok(!stopResult.isError);
      ok(((stopResult.content as any[])[0] as any)?.text?.includes('stopped'));
    } finally {
      await client.close();
    }
  });

  it('should return an error when stopping a non-existent mock', async () => {
    const client = await createClient();

    try {
      const result = await client.callTool({
        name: 'stop_mock',
        arguments: { uuid: '00000000-0000-0000-0000-000000000000' }
      });

      strictEqual(result.isError, true);
      ok(
        Array.isArray(result.content) &&
          (result.content[0] as any)?.text?.includes('No running mock server found')
      );
    } finally {
      await client.close();
    }
  });
});

