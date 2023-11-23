import { Environment, ServerErrorCodes } from '@mockoon/commons';
import {
  MockoonServer,
  ServerMessages,
  createLoggerInstance,
  listenServerEvents
} from '@mockoon/commons-server';
import { Command, Flags } from '@oclif/core';
import { red as chalkRed } from 'chalk';
import { join } from 'path';
import { format } from 'util';
import { Config } from '../config';
import { commonFlags, deprecatedFlags } from '../constants/command.constants';
import { parseDataFiles, prepareEnvironment } from '../libs/data';
import { getDirname, transformEnvironmentName } from '../libs/utils';

export default class Start extends Command {
  public static description = 'Start one or more mock API';

  public static examples = [
    '$ mockoon-cli start --data ~/data.json',
    '$ mockoon-cli start --data ~/data1.json ~/data2.json --port 3000 3001 --hostname 127.0.0.1 192.168.1.1',
    '$ mockoon-cli start --data https://file-server/data.json',
    '$ mockoon-cli start --data ~/data.json --log-transaction',
    '$ mockoon-cli start --data ~/data.json --disable-routes route1 route2'
  ];

  public static flags = {
    ...commonFlags,
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
        "Disable route(s) by UUID or keyword present in the route's path (do not include a leading slash)",
      multiple: true,
      default: []
    }),
    ...deprecatedFlags
  };

  public async run(): Promise<void> {
    const { flags: userFlags } = await this.parse(Start);

    try {
      const parsedEnvironments = await parseDataFiles(userFlags.data);

      for (let envIndex = 0; envIndex < parsedEnvironments.length; envIndex++) {
        try {
          parsedEnvironments[envIndex].environment = await prepareEnvironment({
            environment: parsedEnvironments[envIndex].environment,
            userOptions: {
              hostname: userFlags.hostname[envIndex],
              port: userFlags.port[envIndex]
            },
            repair: userFlags.repair
          });
        } catch (error: any) {
          this.error(error.message);
        }
      }

      for (const environmentInfo of parsedEnvironments) {
        this.createServer({
          environment: environmentInfo.environment,
          environmentDir: getDirname(environmentInfo.originalPath) || '',
          logTransaction: userFlags['log-transaction'],
          fileTransportOptions: userFlags['disable-log-to-file']
            ? null
            : {
                filename: join(
                  Config.logsPath,
                  `${transformEnvironmentName(
                    environmentInfo.environment.name
                  )}.log`
                )
              },
          disabledRoutes: userFlags['disable-routes']
        });
      }
    } catch (error: any) {
      this.error(error.message);
    }
  }

  private createServer = (parameters: {
    environment: Environment;
    environmentDir: string;
    disabledRoutes?: string[];
    logTransaction?: boolean;
    fileTransportOptions?: Parameters<typeof createLoggerInstance>[0] | null;
  }) => {
    const logger = createLoggerInstance(parameters.fileTransportOptions);
    const server = new MockoonServer(parameters.environment, {
      environmentDirectory: parameters.environmentDir,
      disabledRoutes: parameters.disabledRoutes
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
        this.log(`${chalkRed(' »')}   Error: ${errorMessage}`);
        process.exit(2);
      }
    });

    process.on('SIGINT', () => {
      server.stop();
    });

    server.start();
  };
}
