import { ServerErrorCodes } from '@mockoon/commons';

export type MessageParams = { error?: Error; [key: string]: any };
export type MessageCodes =
  | ServerErrorCodes
  | 'ENVIRONMENT_STOPPED'
  | 'ENVIRONMENT_STARTED'
  | 'CREATING_PROXY';
