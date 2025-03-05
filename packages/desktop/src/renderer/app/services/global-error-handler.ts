import { ErrorHandler, Injectable } from '@angular/core';
import { LoggerService } from 'src/renderer/app/services/logger-service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private loggerService: LoggerService) {}

  public handleError(error: Error) {
    this.loggerService.logMessage('error', 'UNKNOWN_ERROR', { error });
  }
}
