import { ServerErrorCodes } from '@mockoon/commons';

export type MessageParams = { [key: string]: any; error?: Error };
export type MessageCodes =
  | keyof typeof ServerErrorCodes
  | 'ENVIRONMENT_STOPPED'
  | 'ENVIRONMENT_STARTED'
  | 'CREATING_PROXY'
  | 'EXPORT_SUCCESS'
  | 'EXPORT_SELECTED_SUCCESS'
  | 'EXPORT_ENVIRONMENT_CLIPBOARD_SUCCESS'
  | 'EXPORT_ROUTE_CLIPBOARD_SUCCESS';
