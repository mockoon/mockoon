import { ok, strictEqual } from 'node:assert';
import { ChildProcess, spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

/**
 * Spawns the CLI in MCP mode (non-TTY stdin → starts the MCP server).
 * Returns helpers to send JSON-RPC messages and await the next response.
 */
const spawnMcp = (): {
  instance: ChildProcess;
  send: (msg: object) => void;
  nextMessage: () => Promise<unknown>;
} => {
  const instance = spawn('node', ['./bin/dev.js', 'mcp']);

  let buffer = '';
  let pendingResolve: ((msg: unknown) => void) | null = null;
  const queue: string[] = [];

  instance.stdout.on('data', (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (pendingResolve) {
        const res = pendingResolve;
        pendingResolve = null;
        res(JSON.parse(trimmed));
      } else {
        queue.push(trimmed);
      }
    }
  });

  const send = (msg: object) => {
    instance.stdin.write(JSON.stringify(msg) + '\n');
  };

  const nextMessage = (): Promise<unknown> => {
    if (queue.length > 0) {
      const item = queue.shift();

      return Promise.resolve(JSON.parse(item ?? ''));
    }

    return new Promise((res) => {
      pendingResolve = res;
    });
  };

  return { instance, send, nextMessage };
};

/**
 * Performs the MCP handshake (initialize + notifications/initialized).
 */
const initialize = async (
  send: (msg: object) => void,
  nextMessage: () => Promise<unknown>
) => {
  send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0' }
    }
  });

  await nextMessage();

  send({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {}
  });
};

describe('MCP command', () => {
  it('should respond to initialize with server info', async () => {
    const { instance, send, nextMessage } = spawnMcp();

    send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0' }
      }
    });

    const response = (await nextMessage()) as any;

    strictEqual(response.id, 1);
    strictEqual(response.result?.serverInfo?.name, 'mockoon');

    instance.kill();
  });

  it('should list environments', async () => {
    const { instance, send, nextMessage } = spawnMcp();

    await initialize(send, nextMessage);

    send({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'list_environments', arguments: {} }
    });

    const response = (await nextMessage()) as any;

    strictEqual(response.id, 2);
    ok(response.result?.content?.[0]?.type === 'text');

    instance.kill();
  });

  it('should start a mock server via start_mock', async () => {
    const { instance, send, nextMessage } = spawnMcp();

    await initialize(send, nextMessage);

    send({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'start_mock',
        arguments: {
          data: resolve('./test/data/envs/mock1.json')
        }
      }
    });

    const response = (await nextMessage()) as any;

    strictEqual(response.id, 2);
    ok(response.result?.content?.[0]?.text?.includes('started on port'));

    instance.kill();
  });

  it('should return an error for a non-existent data file via start_mock', async () => {
    const { instance, send, nextMessage } = spawnMcp();

    await initialize(send, nextMessage);

    send({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'start_mock',
        arguments: {
          data: resolve('./test/data/envs/nonexistent.json')
        }
      }
    });

    const response = (await nextMessage()) as any;

    strictEqual(response.id, 2);
    strictEqual(response.result?.isError, true);
    ok(response.result?.content?.[0]?.text?.includes('Failed to start'));

    instance.kill();
  });
});
