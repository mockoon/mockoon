import { Environment } from '@mockoon/commons';
import {
  createLoggerInstance,
  listenServerEvents,
  MockoonServer
} from '@mockoon/commons-server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Command } from '@oclif/core';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join, resolve } from 'path';
import { z } from 'zod';
import { Config } from '../config.js';
import { parseDataFile } from '../libs/data.js';
import { getDirname } from '../libs/utils.js';

/**
 * Returns the default directory where the Mockoon desktop app stores environment files.
 * Windows: %APPDATA%\mockoon\storage
 * Linux/macOS: ~/.config/mockoon/storage
 */
function getMockoonStorageDir(): string {
  if (process.platform === 'win32') {
    return join(process.env['APPDATA'] ?? homedir(), 'mockoon', 'storage');
  }

  return join(homedir(), '.config', 'mockoon', 'storage');
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
 * Scans a directory for Mockoon environment JSON files.
 * Returns an array of { uuid, line } for each valid environment found.
 * Silently ignores the directory if it does not exist or files cannot be parsed.
 */
function scanDirForEnvironments(dir: string): { uuid: string; line: string }[] {
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
  public static override description =
    'Start a Model Context Protocol (MCP) server to interact with Mockoon via AI assistants (Claude, GitHub Copilot, Cursor, etc.)';

  public static override examples = [
    '$ mockoon-cli mcp',
    '$ mockoon-cli mcp  # then add to MCP client config as: {"command": "mockoon-cli", "args": ["mcp"]}'
  ];

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
          'To include environment files from additional directories, set the MOCKOON_DATA_DIRS\n' +
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

    const runningServers = new Map<string, MockoonServer>();

    mcpServer.registerTool(
      'list_environments',
      {
        description:
          'List all local Mockoon environment files. Returns the file path for each environment, which can be passed to start_mock. Searches the default storage directory and any extra directories set via MOCKOON_DATA_DIRS.'
      },
      async () => {
        const allDirs = [getMockoonStorageDir(), ...getExtraDataDirs()];
        const seen = new Set<string>();
        const envLines: string[] = [];

        for (const dir of allDirs) {
          for (const entry of scanDirForEnvironments(dir)) {
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
                text: `No environments found. Searched directories: ${allDirs.join(', ')}`
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
          'Start a Mockoon mock server from a local environment JSON file. Use list_environments to find available file paths. Returns immediately with an error if the server is already running.',
        inputSchema: {
          data: z
            .string()
            .describe(
              'Absolute path to the Mockoon environment JSON file. Use list_environments to find available paths.'
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
                  text: `Server for environment '${parsed.environment.name}' is already running.`
                }
              ]
            };
          }

          const logger = createLoggerInstance(null);
          const mockServer = new MockoonServer(parsed.environment, {
            environmentDirectory: getDirname(resolve(parsed.originalPath)) ?? ''
          });

          listenServerEvents(mockServer, parsed.environment, logger, false);

          mockServer.on('error', () => {
            runningServers.delete(parsed.environment.uuid);
          });

          mockServer.start();
          runningServers.set(parsed.environment.uuid, mockServer);

          return {
            content: [
              {
                type: 'text',
                text: `Mock server '${parsed.environment.name}' started on port ${parsed.environment.port}.`
              }
            ]
          };
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

    process.on('SIGINT', () => {
      for (const server of runningServers.values()) {
        server.stop();
      }
    });

    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
  }
}
