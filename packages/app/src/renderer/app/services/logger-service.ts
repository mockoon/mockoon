import { Injectable, inject } from '@angular/core';
import { DesktopMessages } from 'src/renderer/app/constants/desktop-messages.constants';
import {
  MessageCodes,
  MessageLevels,
  MessageParams
} from 'src/renderer/app/models/messages.model';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';

/**
 * Logger class that can be used as is or extended
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private mainApiService = inject(MainApiService);
  private toastService = inject(ToastsService);

  /**
   * Log a message and display a toast
   *
   * @param level
   * @param messageCode
   * @param messageParams
   */
  public logMessage(
    level: MessageLevels,
    messageCode: MessageCodes,
    messageParams: MessageParams = null
  ) {
    // if message not implemented, return
    if (!DesktopMessages[messageCode]) {
      return;
    }

    if (messageParams?.error) {
      messageParams = {
        ...messageParams,
        error: {
          message: messageParams.error.message,
          code: messageParams.error.code,
          stack: messageParams.error.stack
        }
      };

      // Strip IPC error prefix
      if (messageParams?.error?.message) {
        messageParams.error.message = messageParams.error.message.replace(
          /Error invoking remote method '[A-Z_]+': /,
          ''
        );
      }
    }

    const message = DesktopMessages[messageCode](messageParams);

    if (message.log) {
      this[level](
        `${message.loggerMessage || message.message}`,
        message.logPayload
      );
    }

    if (message.showToast) {
      this.toastService.addToast(message.toastType, message.message);
    }
  }

  /**
   * Log an info level message
   *
   * @param message
   */
  private info(message: string, payload: any) {
    this.mainApiService.send('APP_LOGS', {
      type: 'info',
      message,
      payload
    });
  }

  /**
   * Log an error level message
   *
   * @param message
   */
  private error(message: string, payload: any) {
    this.mainApiService.send('APP_LOGS', {
      type: 'error',
      message,
      payload
    });
  }
}
