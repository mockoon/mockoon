import { error as LogError, info as LogInfo } from 'electron-log';
import { Messages } from 'src/app/constants/messages.constants';
import { MessageCodes, MessageParams } from 'src/app/models/messages.model';
import { ToastsService } from 'src/app/services/toasts.service';

/**
 * Logger class that can be used as is or extended
 */
export class Logger {
  constructor(
    private loggerPrefix: string,
    protected toastService?: ToastsService
  ) {}

  /**
   * Log a message and display a toast
   *
   * @param level
   * @param messageCode
   * @param messageParams
   */
  public logMessage(
    level: 'info' | 'error',
    messageCode: MessageCodes,
    messageParams: MessageParams = { error: { message: '', name: '' } }
  ) {
    const message = Messages[messageCode](messageParams);

    this[level](`${message.loggerMessage || message.message}`);

    if (this.toastService && message.showToast) {
      this.toastService.addToast('error', message.message);
    }
  }

  /**
   * Log an info level message
   *
   * @deprecated
   * @param message
   */
  public info(message: string) {
    LogInfo(this.buildMessage(message));
  }

  /**
   * Log an error level message
   *
   * @deprecated
   * @param message
   */
  public error(message: string) {
    LogError(this.buildMessage(message));
  }

  private buildMessage(message: string) {
    return `${this.loggerPrefix}${message}`;
  }
}
