import { ErrorHandler, Injectable } from '@angular/core';
import { Logger } from 'src/renderer/app/classes/logger';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = new Logger('[RENDERER] ');

  public handleError(error: Error) {
    this.logger.logMessage('error', 'UNKNOWN_ERROR', { error });
  }
}
