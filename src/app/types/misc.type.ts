import { Request } from 'express';

export interface IEnhancedRequest extends Request {
  uuid: string;
}
