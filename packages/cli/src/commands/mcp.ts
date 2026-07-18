import { Environment } from '@mockoon/commons';
import {
  createLoggerInstance,
  listenServerEvents,
  MockoonServer
} from '@mockoon/commons-server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Command } from '@oclif/core';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { Config } from '../config.js';
import { parseDataFile } from '../libs/data.js';
import { getDirname } from '../libs/utils.js';

/**
 * Returns the default directory where the Mockoon desktop app stores mock files.
 * Windows: %APPDATA%\Mockoon\storage
 * macOS: ~/Library/Application Support/Mockoon/storage
 * Linux: ~/.config/Mockoon/storage
 */
function getMockoonStorageDir(): string {
  if (process.platform === 'win32') {
    return join(process.env['APPDATA'] ?? homedir(), 'Mockoon', 'storage');
  }

  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'Mockoon', 'storage');
  }

  return join(homedir(), '.config', 'Mockoon', 'storage');
}

/**
 * Returns extra directories from the MOCKOON_DATA_DIRS environment variable.
 * Paths are separated by semicolons (;).
 */
function getExtraDataDirs(): string[] {
  const raw = process.env['MOCKOON_DATA_DIRS'];

  if (!raw) return [];

  return raw
    .split(';')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => resolve(p));
}

/**
 * Scans a directory for Mockoon mock JSON files.
 * Returns an array of { uuid, line } for each valid mock found.
 * Silently ignores the directory if it does not exist or files cannot be parsed.
 */
function scanDirForMocks(dir: string): { uuid: string; line: string }[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((file) => {
      try {
        const env: Environment = JSON.parse(
          readFileSync(join(dir, file), 'utf-8')
        );

        if (!env.uuid) return null;

        return {
          uuid: env.uuid,
          line: `- [${env.uuid}] ${env.name} (port: ${env.port}, file: ${join(dir, file)})`
        };
      } catch {
        return null;
      }
    })
    .filter((e): e is { uuid: string; line: string } => e !== null);
}

export default class Mcp extends Command {
  public static override readonly description =
    'Start a Model Context Protocol (MCP) server to interact with Mockoon via AI assistants (Claude, GitHub Copilot, Cursor, etc.)';

  public static override readonly examples = ['$ mockoon-cli mcp'];

  public async run(): Promise<void> {
    if (process.stdin.isTTY) {
      const config = `{
  "mcpServers": {
    "mockoon": {
      "command": "npx",
      "args": ["-y", "@mockoon/cli", "mcp"]
    }
  }
}`;
      this.log(
        'To use the Mockoon MCP Server, add this to your MCP client configuration:\n\n' +
          config +
          '\n\nThe exact key (e.g. "servers" vs "mcpServers") may vary by client.\n\n' +
          'To include mock files from additional directories, set the MOCKOON_DATA_DIRS\n' +
          'environment variable to a semicolon-separated list of directory paths:\n\n' +
          '  "env": { "MOCKOON_DATA_DIRS": "/path/to/dir1;/path/to/dir2" }\n\n' +
          'More info: https://mockoon.com/cli/'
      );

      return;
    }

    const mcpServer = new McpServer({
      name: 'mockoon',
      version: Config.version
    });

    const runningServers = new Map<
      string,
      { server: MockoonServer; name: string; port: number }
    >();

    mcpServer.registerTool(
      'list_mocks',
      {
        description:
          'List all local Mockoon mock files. Returns the file path for each mock, which can be passed to start_mock. Searches the default storage directory and any extra directories set via MOCKOON_DATA_DIRS.'
      },
      async () => {
        const allDirs = [getMockoonStorageDir(), ...getExtraDataDirs()];
        const seen = new Set<string>();
        const envLines: string[] = [];

        for (const dir of allDirs) {
          for (const entry of scanDirForMocks(dir)) {
            if (!seen.has(entry.uuid)) {
              seen.add(entry.uuid);
              envLines.push(entry.line);
            }
          }
        }

        if (envLines.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No mocks found. Searched directories: ${allDirs.join(', ')}`
              }
            ]
          };
        }

        return {
          content: [{ type: 'text', text: envLines.join('\n') }]
        };
      }
    );

    mcpServer.registerTool(
      'start_mock',
      {
        description:
          'Start a Mockoon mock server from a local mock JSON file. Use list_mocks to find available file paths. Returns immediately with an error if the server is already running.',
        inputSchema: {
          data: z
            .string()
            .describe(
              'Absolute path to the Mockoon mock JSON file. Use list_mocks to find available paths.'
            ),
          port: z.number().int().optional().describe('Override port (optional)')
        }
      },
      async ({ data, port }) => {
        try {
          const parsed = await parseDataFile(data, { port }, true);

          if (runningServers.has(parsed.environment.uuid)) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Server for mock '${parsed.environment.name}' is already running.`
                }
              ],
              isError: true
            };
          }

          const logger = createLoggerInstance(null);
          const mockServer = new MockoonServer(parsed.environment, {
            environmentDirectory: getDirname(resolve(parsed.originalPath)) ?? ''
          });

          listenServerEvents(mockServer, parsed.environment, logger, false);

          // Reserve the UUID synchronously so concurrent requests fail the
          // already-running check even while the server is still starting up.
          runningServers.set(parsed.environment.uuid, {
            server: mockServer,
            name: parsed.environment.name,
            port: parsed.environment.port
          });

          function onStopped() {
            runningServers.delete(parsed.environment.uuid);
          }

          const result = await new Promise<{
            content: { type: 'text'; text: string }[];
            isError?: boolean;
          }>((promiseResolve) => {
            function onStarted() {
              mockServer.removeListener('error', onError);
              mockServer.once('stopped', onStopped);
              promiseResolve({
                content: [
                  {
                    type: 'text',
                    text: `Mock server '${parsed.environment.name}' started on port ${parsed.environment.port}.`
                  }
                ]
              });
            }

            function onError(errorCode: string) {
              mockServer.removeListener('started', onStarted);
              runningServers.delete(parsed.environment.uuid);
              promiseResolve({
                content: [
                  {
                    type: 'text',
                    text: `Failed to start mock server '${parsed.environment.name}': ${errorCode}`
                  }
                ],
                isError: true
              });
            }

            mockServer.once('started', onStarted);
            mockServer.once('error', onError);
            mockServer.start();
          });

          return result;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);

          return {
            content: [
              { type: 'text', text: `Failed to start mock server: ${message}` }
            ],
            isError: true
          };
        }
      }
    );

    mcpServer.registerTool(
      'list_running_mocks',
      {
        description:
          'List all mock servers currently running in this MCP session. Returns name, port, and UUID for each running mock.'
      },
      async () => {
        if (runningServers.size === 0) {
          return {
            content: [{ type: 'text', text: 'No mock servers are currently running.' }]
          };
        }

        const lines = Array.from(runningServers.entries()).map(
          ([uuid, { name, port }]) =>
            `- [${uuid}] ${name} (port: ${port})`
        );

        return {
          content: [{ type: 'text', text: lines.join('\n') }]
        };
      }
    );

    mcpServer.registerTool(
      'stop_mock',
      {
        description:
          'Stop a running Mockoon mock server by its UUID. Use list_running_mocks to find running UUIDs.',
        inputSchema: {
          uuid: z.string().describe('UUID of the mock server to stop')
        }
      },
      async ({ uuid }) => {
        const server = runningServers.get(uuid);

        if (!server) {
          return {
            content: [
              {
                type: 'text',
                text: `No running mock server found with UUID '${uuid}'.`
              }
            ],
            isError: true
          };
        }

        server.server.stop();
        runningServers.delete(uuid);

        return {
          content: [
            { type: 'text', text: `Mock server '${server.name}' stopped.` }
          ]
        };
      }
    );

    process.once('SIGINT', () => {
      for (const { server } of runningServers.values()) {
        server.stop();
      }
      process.exit(0);
    });

    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
  }
}
