import {
  Environment,
  Methods,
  ServerErrorCodes,
  Transaction
} from '@mockoon/commons';
import { MockoonServer } from '@mockoon/commons-server';
import { readFileSync as readJSONFileSync } from 'jsonfile';
import { format } from 'util';
import {
  createLogger,
  format as logFormat,
  Logger,
  transports as logsTransports
} from 'winston';
import {
  ConsoleTransportInstance,
  FileTransportInstance,
  FileTransportOptions
} from 'winston/lib/winston/transports';
import { Messages } from '../constants/messages.constants';

let logger: Logger;

const createLoggerInstance = (
  fileTransportsOptions: FileTransportOptions[] | undefined
) => {
  const transportsInstances: (
    | FileTransportInstance
    | ConsoleTransportInstance
  )[] = [new logsTransports.Console()];

  if (fileTransportsOptions?.length) {
    fileTransportsOptions.forEach((fileTransportOption) => {
      transportsInstances.push(new logsTransports.File(fileTransportOption));
    });
  }

  logger = createLogger({
    level: 'info',
    format: logFormat.combine(logFormat.timestamp(), logFormat.json()),
    transports: transportsInstances
  });
};

const addEventListeners = function (
  server: MockoonServer,
  environment: Environment,
  logTransaction?: boolean
) {
  const logMeta: any = { mockName: environment.name };

  server.on('started', () => {
    logger.info(format(Messages.SERVER.STARTED, environment.port), logMeta);

    if (!!process.send) {
      process.send('ready');
    }
  });

  server.on('error', (errorCode, error) => {
    // throw blocking errors
    if (
      errorCode === ServerErrorCodes.PORT_ALREADY_USED ||
      errorCode === ServerErrorCodes.PORT_INVALID ||
      errorCode === ServerErrorCodes.UNKNOWN_SERVER_ERROR
    ) {
      throw new Error(error?.message);
    }

    // report non blocking errors
    if (
      [
        ServerErrorCodes.REQUEST_BODY_PARSE,
        ServerErrorCodes.ROUTE_FILE_SERVING_ERROR,
        ServerErrorCodes.ROUTE_SERVING_ERROR,
        ServerErrorCodes.ROUTE_CREATION_ERROR,
        ServerErrorCodes.ROUTE_CREATION_ERROR_REGEX,
        ServerErrorCodes.PROXY_ERROR
      ].indexOf(errorCode) > -1
    ) {
      logger.error(error?.message || '', logMeta);
    }
  });

  server.on('creating-proxy', () => {
    logger.info(
      format(Messages.SERVER.CREATING_PROXY, environment.proxyHost),
      logMeta
    );
  });

  server.on('transaction-complete', (transaction: Transaction) => {
    transaction.request.method =
      transaction.request.method.toUpperCase() as keyof typeof Methods;

    if (logTransaction) {
      logMeta.transaction = transaction;
    }

    logger.info(
      `${transaction.request.method.toUpperCase()} ${
        transaction.request.urlPath
      } | ${transaction.response.statusCode}${
        transaction.proxied ? ' | proxied' : ''
      }`,
      logMeta
    );
  });

  server.on('stopped', () => {
    logger.info(Messages.SERVER.STOPPED, logMeta);
  });

  process.on('SIGINT', () => {
    server.stop();
  });
};

export const createServer = (parameters: {
  data: string;
  environmentDir: string;
  logTransaction?: boolean;
  fileTransportsOptions?: FileTransportOptions[];
}): void => {
  try {
    createLoggerInstance(parameters.fileTransportsOptions);

    const environment: Environment = readJSONFileSync(parameters.data);

    const server = new MockoonServer(environment, {
      logProvider: () => ({
        log: logger.log.bind(logger),
        debug: logger.debug.bind(logger),
        info: logger.info.bind(logger),
        warn: logger.warn.bind(logger),
        error: logger.error.bind(logger)
      }),
      environmentDirectory: parameters.environmentDir
    });

    addEventListeners(server, environment, parameters.logTransaction);

    server.start();
  } catch (error: any) {
    throw new Error(error.message);
  }
};
