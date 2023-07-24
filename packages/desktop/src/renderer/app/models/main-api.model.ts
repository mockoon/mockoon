import {
  Environment,
  Environments,
  FakerAvailableLocales,
  ServerErrorCodes,
  ServerEvents,
  Transaction
} from '@mockoon/commons';
import {
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue
} from 'electron';
import { PreMigrationSettings } from 'src/renderer/app/models/settings.model';
import {
  EnvironmentDescriptor,
  Settings
} from 'src/shared/models/settings.model';

export interface MainAPIModel {
  invoke<T>(
    channel: 'APP_NEW_STORAGE_MIGRATION'
  ): Promise<EnvironmentDescriptor[]>;
  invoke(
    channel: 'APP_READ_ENVIRONMENT_DATA',
    path: string
  ): Promise<Environment>;
  invoke(channel: 'APP_READ_SETTINGS_DATA'): Promise<PreMigrationSettings>;
  invoke(
    channel: 'APP_WRITE_ENVIRONMENT_DATA',
    data: Environment,
    path: string,
    storagePrettyPrint?: boolean
  ): Promise<void>;
  invoke(
    channel: 'APP_WRITE_SETTINGS_DATA',
    newSettings: Settings,
    storagePrettyPrint?: boolean
  ): Promise<void>;
  invoke(channel: 'APP_READ_CLIPBOARD'): Promise<any>;
  invoke(channel: 'APP_GET_PLATFORM'): Promise<NodeJS.Platform>;
  invoke(
    channel: 'APP_SHOW_OPEN_DIALOG',
    options: OpenDialogOptions
  ): Promise<OpenDialogReturnValue>;
  invoke(
    channel: 'APP_SHOW_SAVE_DIALOG',
    options: SaveDialogOptions
  ): Promise<SaveDialogReturnValue>;
  invoke(
    channel:
      | 'APP_GET_MIME_TYPE'
      | 'APP_GET_FILENAME'
      | 'APP_READ_FILE'
      | 'APP_BUILD_STORAGE_FILEPATH'
      | 'APP_GET_BASE_PATH'
      | 'APP_REPLACE_FILEPATH_EXTENSION',
    pathOrName: string
  ): Promise<string>;
  invoke(channel: 'APP_WRITE_FILE', path: string, data: string): Promise<void>;
  invoke(
    channel: 'APP_OPENAPI_CONVERT_FROM',
    path: string,
    port?: number
  ): Promise<Environment | null>;
  invoke(
    channel: 'APP_OPENAPI_CONVERT_TO',
    environment: Environment
  ): Promise<string>;
  invoke(
    channel: 'APP_START_SERVER',
    environment: Environment,
    environmentPath: string
  ): Promise<any>;
  invoke(channel: 'APP_STOP_SERVER', environmentUUID: string): Promise<any>;
  invoke(channel: 'APP_GET_OS'): Promise<string>;
  invoke(channel: 'APP_UNWATCH_FILE', UUID: string): Promise<void>;
  invoke(channel: 'APP_UNWATCH_ALL_FILE'): Promise<void>;

  send(channel: 'APP_WRITE_CLIPBOARD', data: any): void;
  send(
    channel:
      | 'APP_DISABLE_ENVIRONMENT_MENU_ENTRIES'
      | 'APP_ENABLE_ENVIRONMENT_MENU_ENTRIES'
      | 'APP_DISABLE_ROUTE_MENU_ENTRIES'
      | 'APP_ENABLE_ROUTE_MENU_ENTRIES'
      | 'APP_QUIT'
      | 'APP_HIDE_WINDOW'
      | 'APP_APPLY_UPDATE'
  ): void;
  send(
    channel: 'APP_OPEN_EXTERNAL_LINK' | 'APP_SHOW_FILE',
    urlOrPath: string
  ): void;
  send(
    channel: 'APP_LOGS',
    data: { type: 'error' | 'info'; message: string; payload?: any }
  ): void;
  send(
    channel: 'APP_SET_FAKER_OPTIONS',
    data: { locale: FakerAvailableLocales; seed: number }
  ): void;
  send(channel: 'APP_UPDATE_ENVIRONMENT', environments: Environments): void;

  receive(
    channel: 'APP_SERVER_EVENT',
    listener: (
      environmentUUID: string,
      eventName: keyof ServerEvents,
      data: {
        errorCode?: ServerErrorCodes;
        originalError?: Error;
        transaction?: Transaction;
      }
    ) => void
  ): void;
  receive(channel: 'APP_MENU', listener: (action: string) => void): void;
  receive(channel: 'APP_UPDATE_AVAILABLE', listener: () => void): void;
  receive(
    channel: 'APP_CUSTOM_PROTOCOL',
    listener:
      | ((
          action: 'load-environment' | 'load-export-data',
          parameters: { url: string }
        ) => void)
      | ((action: 'auth', parameters: { token: string }) => void)
  ): void;

  receive(
    channel: 'APP_FILE_EXTERNAL_CHANGE',
    listener: (previousUUID: string, environmentPath: string) => void
  ): void;
}
