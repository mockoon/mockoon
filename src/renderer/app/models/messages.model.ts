import { ServerErrorCodes } from '@mockoon/commons';

export type MessageLevels = 'error' | 'info';
export type MessageParams = { [key: string]: any; error?: Error };
export type MessageCodes =
  | keyof typeof ServerErrorCodes
  | 'ENVIRONMENT_STOPPED'
  | 'ENVIRONMENT_STARTED'
  | 'CREATING_PROXY'
  | 'EXPORT_SUCCESS'
  | 'EXPORT_SELECTED_SUCCESS'
  | 'EXPORT_ENVIRONMENT_CLIPBOARD_SUCCESS'
  | 'EXPORT_ROUTE_CLIPBOARD_SUCCESS'
  | 'ENVIRONMENT_FILE_IN_USE'
  | 'FIRST_LOAD_DEMO_ENVIRONMENT'
  | 'ENVIRONMENT_MORE_RECENT_VERSION'
  | 'ENVIRONMENT_MIGRATION_FAILED';
