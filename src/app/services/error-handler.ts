import { ErrorHandler, Injectable } from '@angular/core';
import { Logger } from 'src/app/classes/logger';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = new Logger('[APPLICATION]');

  handleError(error) {
    this.logger.error(`Unexpected error: ${error.message} ${error.stack}`);
  }
}
