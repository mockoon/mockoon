import { ServerErrorCodes } from '../enums/errors.enum';
import { Transaction } from './server.model';

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
  'transaction-complete': (transaction: Transaction) => void;
};
