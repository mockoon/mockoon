import {
  Environment,
  FakerAvailableLocales,
  FakerAvailableLocalesList,
  ServerErrorCodes,
  ServerOptions,
  defaultEnvironmentVariablesPrefix,
  defaultMaxTransactionLogs
} from '@mockoon/commons';
import {
  MockoonServer,
  ServerMessages,
  createLoggerInstance,
  listenServerEvents
} from '@mockoon/commons-server';
import { Command, Flags } from '@oclif/core';
import { watch } from 'chokidar';
import { join, resolve } from 'path';
import { format } from 'util';
import { Config } from '../config';
import {
  commonFlags,
  logTransactionFlag
} from '../constants/command.constants';
import { parseDataFile } from '../libs/data';
import { getDirname, transformEnvironmentName } from '../libs/utils';

export default class Start extends Command {
  public static description = 'Start one or more mock API';

  public static examples = [
    '$ mockoon-cli start --data ~/data.json',
    '$ mockoon-cli start --data ~/data.json --watch',
    '$ mockoon-cli start --data ~/data1.json ~/data2.json --port 3000 3001 --hostname 127.0.0.1 192.168.1.1',
    '$ mockoon-cli start --data https://file-server/data.json',
    '$ mockoon-cli start --data ~/data.json --log-transaction',
    '$ mockoon-cli start --data ~/data.json --disable-routes route1 route2',
    '$ mockoon-cli start --data ~/data.json --enable-random-latency'
  ];

  public static flags = {
    ...commonFlags,
    ...logTransactionFlag,
    hostname: Flags.string({
      char: 'l',
      description: 'Listening hostname(s)',
      multiple: true,
      default: []
    }),
    port: Flags.integer({
      char: 'p',
      description: 'Override environment(s) port(s)',
      multiple: true,
      default: []
    }),
    'public-base-url': Flags.string({
      description:
        'Public base URL used to resolve relative callback URLs and for the baseUrl templating helper (e.g. https://api.example.com or http://localhost:3000). Must include the protocol and port if non-standard.',
      multiple: true,
      default: []
    }),
    repair: Flags.boolean({
      char: 'r',
      description:
        'If the data file seems too old, or an invalid Mockoon file, migrate/repair without prompting',
      default: false
    }),
    'disable-log-to-file': Flags.boolean({
      char: 'X',
      description: 'Only log to stdout and stderr',
      default: false
    }),
    'disable-routes': Flags.string({
      char: 'e',
      description:
        "Disable route(s) by UUID or keyword present in the route's path or keyword present in a folder name (do not include a leading slash)",
      multiple: true,
      default: []
    }),
    'faker-locale': Flags.string({
      char: 'c',
      description:
        "Faker locale (e.g. 'en', 'en_GB', etc. For supported locales, see documentation: https://github.com/mockoon/mockoon/blob/main/packages/cli/README.md#fakerjs-options)",
      default: 'en'
    }),
    'faker-seed': Flags.integer({
      char: 's',
      description: 'Number for the Faker.js seed (e.g. 1234)',
      default: undefined
    }),
    'env-vars-prefix': Flags.string({
      char: 'x',
      description: `Prefix of environment variables available at runtime (default: "${defaultEnvironmentVariablesPrefix}")`,
      multiple: false,
      default: defaultEnvironmentVariablesPrefix
    }),
    'disable-admin-api': Flags.boolean({
      description:
        'Disable the admin API, enabled by default (more info: https://mockoon.com/docs/latest/admin-api/overview/)',
      default: false
    }),
    'disable-tls': Flags.boolean({
      description:
        'Disable TLS for all environments. TLS configuration is part of the environment configuration (more info: https://mockoon.com/docs/latest/server-configuration/serving-over-tls/).',
      default: false
    }),
    'max-transaction-logs': Flags.integer({
      description: `Maximum number of transaction logs to keep in memory for retrieval via the admin API (default: ${defaultMaxTransactionLogs}).`,
      default: defaultMaxTransactionLogs
    }),
    'enable-random-latency': Flags.boolean({
      description:
        'Enable random latency from 0 to value specified in the route settings',
      default: false
    }),
    proxy: Flags.string({
      description: "Override the environment's proxy settings",
      options: ['enabled', 'disabled'] as const
    }),
    watch: Flags.boolean({
      char: 'w',
      description:
        'Watch local data file(s) for changes and restart the server when a change is detected',
      default: false
    }),
    'polling-interval': Flags.integer({
      description: 'Local files watch polling interval in milliseconds',
      default: 2000
    }),
    token: Flags.string({
      char: 'k',
      description: 'Mockoon cloud authentication token',
      env: 'MOCKOON_CLOUD_TOKEN'
    })
  };

  public async run(): Promise<void> {
    const { flags: userFlags } = await this.parse(Start);

    // validate flags
    if (
      !FakerAvailableLocalesList.includes(
        userFlags['faker-locale'] as FakerAvailableLocales
      )
    ) {
      this.error(
        'Invalid Faker.js locale. See documentation for supported locales (https://github.com/mockoon/mockoon/blob/main/packages/cli/README.md#fakerjs-options).'
      );
    }
    if (
      userFlags.data.some(
        (dataFilePath) =>
          dataFilePath.startsWith(Config.cloudScheme) && !userFlags.token
      )
    ) {
      this.error(
        'A token is required to load cloud environments. Use the --token flag or set the MOCKOON_CLOUD_TOKEN environment variable.'
      );
    }

    try {
      for (const [index, dataFilePath] of userFlags.data.entries()) {
        const parsedEnvironment = await parseDataFile(
          dataFilePath,
          {
            port: userFlags.port[index],
            hostname: userFlags.hostname[index],
            proxy: userFlags.proxy as 'enabled' | 'disabled'
          },
          userFlags.repair,
          userFlags.token
        );
        const server = this.createServer({
          environment: parsedEnvironment.environment,
          // resolve the environment path to an absolute path to avoid false positives when detecting path traversal
          environmentDirectory:
            getDirname(resolve(parsedEnvironment.originalPath)) ?? '',
          logTransaction: userFlags['log-transaction'],
          fileTransportOptions: userFlags['disable-log-to-file']
            ? null
            : {
                filename: join(
                  Config.logsPath,
                  `${transformEnvironmentName(
                    parsedEnvironment.environment.name
                  )}.log`
                )
              },
          disabledRoutes: userFlags['disable-routes'],
          fakerOptions: {
            locale: userFlags['faker-locale'] as FakerAvailableLocales,
            seed: userFlags['faker-seed']
          },
          envVarsPrefix: userFlags['env-vars-prefix'],
          enableAdminApi: !userFlags['disable-admin-api'],
          disableTls: userFlags['disable-tls'],
          maxTransactionLogs: userFlags['max-transaction-logs'],
          enableRandomLatency: userFlags['enable-random-latency'],
          publicBaseUrl: userFlags['public-base-url'][index]
        });

        if (!dataFilePath.startsWith('http') && userFlags.watch) {
          const watcher = watch(dataFilePath, {
            ignoreInitial: true,
            persistent: false,
            usePolling: true,
            interval: userFlags['polling-interval']
          });

          watcher.on('change', async (changedFilePath) => {
            try {
              const parsedNewEnvironment = await parseDataFile(
                changedFilePath,
                {
                  port: userFlags.port[index],
                  hostname: userFlags.hostname[index],
                  proxy: userFlags.proxy as 'enabled' | 'disabled'
                },
                userFlags.repair,
                userFlags.token
              );

              server.stop();

              server.updateEnvironment(parsedNewEnvironment.environment);
              server.start();
            } catch (error) {
              if (error instanceof Error) {
                this.error(
                  `Error while processing file change for ${changedFilePath}: ${error.message}`
                );
              }
            }
          });
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        this.error(error.message);
      }
    }
  }

  private createServer = (
    parameters: ServerOptions & {
      environment: Environment;
      logTransaction?: boolean;
      fileTransportOptions?: Parameters<typeof createLoggerInstance>[0] | null;
      publicBaseUrl?: string;
    }
  ) => {
    const logger = createLoggerInstance(parameters.fileTransportOptions);
    const server = new MockoonServer(parameters.environment, {
      environmentDirectory: parameters.environmentDirectory,
      disabledRoutes: parameters.disabledRoutes,
      fakerOptions: parameters.fakerOptions,
      envVarsPrefix: parameters.envVarsPrefix,
      enableAdminApi: parameters.enableAdminApi,
      disableTls: parameters.disableTls,
      maxTransactionLogs: parameters.maxTransactionLogs,
      enableRandomLatency: parameters.enableRandomLatency,
      publicBaseUrl: parameters.publicBaseUrl
    });

    listenServerEvents(
      server,
      parameters.environment,
      logger,
      parameters.logTransaction
    );

    server.on('error', (errorCode, originalError) => {
      const exitErrors = [
        ServerErrorCodes.PORT_ALREADY_USED,
        ServerErrorCodes.PORT_INVALID,
        ServerErrorCodes.HOSTNAME_UNAVAILABLE,
        ServerErrorCodes.HOSTNAME_UNKNOWN,
        ServerErrorCodes.CERT_FILE_NOT_FOUND,
        ServerErrorCodes.UNKNOWN_SERVER_ERROR
      ];

      let errorMessage: string | undefined = originalError?.message;

      switch (errorCode) {
        case ServerErrorCodes.PORT_ALREADY_USED:
        case ServerErrorCodes.PORT_INVALID:
          errorMessage = format(
            ServerMessages[errorCode],
            parameters.environment.port
          );
          break;
        case ServerErrorCodes.UNKNOWN_SERVER_ERROR:
          errorMessage = format(
            ServerMessages[errorCode],
            originalError?.message
          );
          break;
        case ServerErrorCodes.CERT_FILE_NOT_FOUND:
          errorMessage = ServerMessages[errorCode];
          break;
        case ServerErrorCodes.HOSTNAME_UNAVAILABLE:
        case ServerErrorCodes.HOSTNAME_UNKNOWN:
          errorMessage = format(
            ServerMessages[errorCode],
            parameters.environment.hostname
          );
          break;
      }

      // Cannot use this.error() as Oclif does not catch it (it seems to be lost due to the async nature of Node.js http server.listen errors).
      if (exitErrors.includes(errorCode)) {
        // red "»" character
        this.log(`\x1b[31m»\x1b[0m   Error: ${errorMessage}`);
        process.exit(2);
      }
    });

    process.on('SIGINT', () => {
      server.stop();
    });

    server.start();

    return server;
  };
}
