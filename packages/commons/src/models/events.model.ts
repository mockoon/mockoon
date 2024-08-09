import { ServerErrorCodes } from '../enums/errors.enum';
import { InFlightRequest, InvokedCallback, Transaction } from './server.model';

export type ServerEvents = {
  error: (
    errorCode: ServerErrorCodes,
    originalError: Error | null,
    /**
     * Additional payload to surface some info from the server (route UUID, etc.)
     */
    payload?: any
  ) => void;
  stopped: () => void;
  'creating-proxy': () => void;
  started: () => void;
  'entering-request': () => void;
  'callback-invoked': (callback: InvokedCallback) => void;
  'transaction-complete': (transaction: Transaction) => void;

  /**
   * Web socket related events
   */
  'ws-new-connection': (request: InFlightRequest) => void;
  'ws-closed': (
    request: InFlightRequest,
    wsCode: number,
    reason?: string | null
  ) => void;
  'ws-message-received': (request: InFlightRequest, message: string) => void;
};
