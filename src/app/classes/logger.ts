import { error as LogError, info as LogInfo } from 'electron-log';

/**
 * Write logs to file using electron-log
 */
export class Logger {
  constructor(private prefix: string) {}

  public info(message: string) {
    LogInfo(this.buildMessage(message));
  }

  public error(message: string) {
    LogError(this.buildMessage(message));
  }

  private buildMessage(message: string) {
    return `${this.prefix} ${message}`;
  }
}
