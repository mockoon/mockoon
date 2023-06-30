import { Environment, ServerErrorCodes } from '@mockoon/commons';
import {
  createLoggerInstance,
  listenServerEvents,
  MockoonServer,
  ServerMessages
} from '@mockoon/commons-server';
import { readFileSync as readJSONFileSync } from 'jsonfile';

export const createServer = (parameters: {
  data: string;
  environmentDir: string;
  logTransaction?: boolean;
  fileTransportOptions?: Parameters<typeof createLoggerInstance>[0] | null;
}): void => {
  try {
    const logger = createLoggerInstance(parameters.fileTransportOptions);

    const environment: Environment = readJSONFileSync(parameters.data);

    const server = new MockoonServer(environment, {
      environmentDirectory: parameters.environmentDir
    });

    listenServerEvents(server, environment, logger, parameters.logTransaction);

    // CLI specific behavior: throw blocking errors
    server.on('error', (errorCode) => {
      if (
        errorCode === ServerErrorCodes.PORT_ALREADY_USED ||
        errorCode === ServerErrorCodes.PORT_INVALID ||
        errorCode === ServerErrorCodes.UNKNOWN_SERVER_ERROR ||
        errorCode === ServerErrorCodes.CERT_FILE_NOT_FOUND
      ) {
        throw new Error(ServerMessages[errorCode]);
      }
    });

    process.on('SIGINT', () => {
      server.stop();
    });

    server.start();
  } catch (error: any) {
    throw new Error(error.message);
  }
};
