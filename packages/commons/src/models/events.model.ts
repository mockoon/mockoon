import { ServerErrorCodes } from '../enums/errors.enum';
import { Transaction } from './server.model';

export interface ServerEvents {
  error: (errorCode: ServerErrorCodes, originalError?: Error) => void;
  stopped: () => void;
  'creating-proxy': () => void;
  started: () => void;
  'entering-request': () => void;
  'transaction-complete': (transaction: Transaction) => void;
}
