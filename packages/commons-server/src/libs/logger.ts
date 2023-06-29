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

export const createLoggerInstance = (
  fileTransportOptions?: FileTransportOptions | null
): Logger => {
  const transportsInstances: (
    | FileTransportInstance
    | ConsoleTransportInstance
  )[] = [new logsTransports.Console({ handleExceptions: true })];

  if (fileTransportOptions) {
    transportsInstances.push(
      new logsTransports.File({
        ...fileTransportOptions,
        handleExceptions: true
      })
    );
  }

  return createLogger({
    level: 'info',
    format: logFormat.combine(logFormat.timestamp(), logFormat.json()),
    transports: transportsInstances,
    exitOnError: false
  });
};
