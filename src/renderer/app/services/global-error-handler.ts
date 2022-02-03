import { ErrorHandler, Injectable } from '@angular/core';
import { Logger } from 'src/renderer/app/classes/logger';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = new Logger('[APPLICATION]');

  public handleError(error) {
    this.logger.logMessage('error', 'UNKNOWN_ERROR');
  }
}
