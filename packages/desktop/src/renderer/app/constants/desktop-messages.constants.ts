import {
  MessageCodes,
  MessageParams
} from 'src/renderer/app/models/messages.model';
import { ToastTypes } from 'src/renderer/app/models/toasts.model';

export const DesktopMessages: {
  [key in MessageCodes | string]:
    | ((messageParams: MessageParams) => {
        // message used for both logging and toasts
        message: string;
        // should send log or not
        log: boolean;
        logPayload?: any;
        // override logging message
        loggerMessage?: string;
        // should display a toast or not
        showToast: false;
      })
    | ((messageParams: MessageParams) => {
        // message used for both logging and toasts
        message: string;
        // should send log or not
        log: boolean;
        logPayload?: any;
        // override logging message
        loggerMessage?: string;
        // should display a toast or not
        showToast: true;
        toastType: ToastTypes;
      });
} = {
  INITIALIZING_APP: () => ({
    message: 'Initializing application',
    log: true,
    showToast: false
  }),
  UNKNOWN_ERROR: (messageParams) => {
    const errorInfo =
      typeof messageParams.error === 'string'
        ? messageParams.error
        : `${messageParams.error.message || ''} - ${
            messageParams.error.stack || ''
          }`;

    return {
      message: `Unexpected error: ${errorInfo}`,
      log: true,
      showToast: false
    };
  },
  PORT_ALREADY_USED: (messageParams) => {
    const message = `Port ${messageParams.port} is already in use`;

    return {
      message,
      log: false,
      showToast: true,
      toastType: 'error'
    };
  },
  PORT_INVALID: (messageParams) => ({
    message: `Port ${messageParams.port} is invalid or access is denied`,
    showToast: true,
    log: false,
    toastType: 'error'
  }),
  ROUTE_NO_LONGER_EXISTS: null,
  HOSTNAME_UNKNOWN: (messageParams) => ({
    message: `Unknown hostname/address provided: ${messageParams.hostname}}`,
    showToast: true,
    log: false,
    toastType: 'error'
  }),
  HOSTNAME_UNAVAILABLE: (messageParams) => ({
    message: 'Provided hostname/address is not available',
    showToast: true,
    log: false,
    toastType: 'error'
  }),
  CERT_FILE_NOT_FOUND: (messageParams) => ({
    message: `Certificate file not found: ${messageParams.error.message}`,
    showToast: true,
    log: false,
    toastType: 'error'
  }),
  REQUEST_BODY_PARSE: (messageParams) => {
    const message = `Error while parsing entering body: ${messageParams.error.message}`;

    return {
      message,
      showToast: true,
      log: false,
      toastType: 'error'
    };
  },
  ROUTE_CREATION_ERROR: (messageParams) => ({
    message: `Error while creating the route: ${messageParams.error.message}`,
    log: false,
    showToast: true,
    toastType: 'error'
  }),
  ROUTE_CREATION_ERROR_REGEX: (messageParams) => ({
    message: `Error while creating the route, regex path is invalid: ${messageParams.error.message}`,
    log: false,
    showToast: true,
    toastType: 'error'
  }),
  ROUTE_SERVING_ERROR: (messageParams) => ({
    message: `Error while serving the content: ${messageParams.error.message}`,
    log: false,
    showToast: true,
    toastType: 'warning'
  }),
  ROUTE_FILE_SERVING_ERROR: (messageParams) => ({
    message: `Error while serving the file content: ${messageParams.error.message}`,
    log: false,
    showToast: true,
    toastType: 'warning'
  }),
  UNKNOWN_SERVER_ERROR: (messageParams) => ({
    message: `An unknown server error occured: ${messageParams.error.message}`,
    log: false,
    showToast: true,
    toastType: 'error'
  }),
  OPENAPI_EXPORT_SUCCESS: (messageParams) => ({
    message: `Environment ${messageParams.environmentName} has been successfully exported`,
    log: false,
    showToast: true,
    toastType: 'success'
  }),
  OPENAPI_EXPORT_ERROR: (messageParams) => ({
    message: `Error while exporting environment to OpenAPI format: ${messageParams.error.message}`,
    log: true,
    logPayload: {
      environmentUUID: messageParams.environmentUUID,
      environmentName: messageParams.environmentName
    },
    showToast: true,
    toastType: 'error'
  }),
  OPENAPI_IMPORT_SUCCESS: (messageParams) => ({
    message: `Environment "${messageParams.environmentName}" has been successfully imported`,
    showToast: true,
    log: false,
    toastType: 'success'
  }),
  OPENAPI_IMPORT_ERROR: (messageParams) => ({
    message: `Error while importing environment from OpenAPI format: ${messageParams.error.message}`,
    showToast: true,
    log: true,
    toastType: 'error'
  }),
  COPY_ENVIRONMENT_CLIPBOARD_SUCCESS: () => ({
    message: 'Environment has been successfully copied to the clipboard',
    showToast: true,
    log: false,
    toastType: 'success'
  }),
  COPY_ENVIRONMENT_CLIPBOARD_ERROR: (messageParams) => ({
    message: `An error occured while copying the environment to the clipboard: ${messageParams.error.message}`,
    showToast: true,
    log: true,
    logPayload: { environmentUUID: messageParams.environmentUUID },
    toastType: 'error'
  }),
  COPY_ROUTE_CLIPBOARD: (messageParams) => ({
    message: `Copying route ${messageParams.routeUUID} to the clipboard`,
    log: true,
    showToast: false
  }),
  COPY_ROUTE_CLIPBOARD_SUCCESS: () => ({
    message: 'Route has been successfully copied to the clipboard',
    log: false,
    showToast: true,
    toastType: 'success'
  }),
  COPY_ROUTE_CLIPBOARD_ERROR: (messageParams) => ({
    message: `An error occured while copying the route to the clipboard: ${messageParams.error.message}`,
    log: true,
    logPayload: { routeUUID: messageParams.routeUUID },
    showToast: true,
    toastType: 'error'
  }),
  NEW_ENVIRONMENT_FROM_URL: (messageParams) => ({
    message: `Importing environment from URL: ${messageParams.url}`,
    log: true,
    showToast: false
  }),
  NEW_ENVIRONMENT_CLIPBOARD_ERROR: (messageParams) => ({
    message: `Error while loading environment from clipboard: ${messageParams.error.message}`,
    log: true,
    showToast: true,
    toastType: 'error'
  }),
  NEW_ENVIRONMENT_URL_ERROR: (messageParams) => ({
    message: `Error while loading environment from URL: ${messageParams.error.message}`,
    log: true,
    showToast: true,
    toastType: 'error'
  }),
  NEW_ROUTE_CLIPBOARD_ERROR: (messageParams) => ({
    message: `Error while loading route from clipboard: ${messageParams.error.message}`,
    log: true,
    showToast: true,
    toastType: 'error'
  }),
  ENVIRONMENT_FILE_IN_USE: () => ({
    message: 'This environment file is already in use',
    log: false,
    showToast: true,
    toastType: 'error'
  }),
  FIRST_LOAD_DEMO_ENVIRONMENT: () => ({
    message: 'First load, creating demo environment',
    log: true,
    showToast: false
  }),
  ENVIRONMENT_MORE_RECENT_VERSION: (messageParams) => ({
    message: `Environment "${
      messageParams.environmentName || messageParams.environmentUUID
    }" was created with a more recent version of Mockoon. Please upgrade.`,
    log: true,
    loggerMessage:
      'Environment was created with a more recent version of Mockoon. Please upgrade.',
    logPayload: messageParams,
    showToast: true,
    toastType: 'warning'
  }),
  ENVIRONMENT_IS_EXPORT_FILE: () => ({
    message: 'This file is an export file. Please import it.',
    log: true,
    showToast: true,
    toastType: 'warning'
  }),
  ENVIRONMENT_MIGRATION_FAILED: (messageParams) => ({
    message: `Migration of environment "${
      messageParams.environmentName || messageParams.environmentUUID
    }" failed. The environment was automatically repaired and migrated to the latest version.`,
    log: true,
    loggerMessage:
      'Migration of environment failed. The environment was automatically repaired and migrated to the latest version.',
    logPayload: messageParams,
    showToast: true,
    toastType: 'warning'
  }),
  STORAGE_LOAD_ERROR: (messageParams) => ({
    message: `Error while loading ${messageParams.path}. Please restart the application.`,
    loggerMessage: `Error while loading ${messageParams.path}: ${
      messageParams.error.code || ''
    } ${messageParams.error.message || ''}`,
    log: true,
    showToast: true,
    toastType: 'error'
  }),
  STORAGE_SAVE_ERROR: (messageParams) => ({
    message: `Error while saving ${messageParams.path}. If the problem persists please restart the application.`,
    loggerMessage: `Error while saving ${messageParams.path}: ${
      messageParams.error.code || ''
    } ${messageParams.error.message || ''}`,
    log: true,
    showToast: true,
    toastType: 'error'
  }),
  MIGRATING_ENVIRONMENT: (messageParams) => ({
    message: `Migrating environment ${messageParams.environmentUUID} starting at ${messageParams.migrationStartId}`,
    log: true,
    loggerMessage: `Migrating environment starting at ${messageParams.migrationStartId}`,
    logPayload: {
      environmentUUID: messageParams.environmentUUID,
      environmentName: messageParams.environmentName
    },
    showToast: false
  }),
  LOGIN_ERROR: () => ({
    message: 'Error while logging in. Please check your credentials.',
    log: true,
    toastType: 'warning',
    showToast: true
  }),
  LOGIN_SUCCESS: () => ({
    message: 'You are now logged in.',
    log: true,
    toastType: 'success',
    showToast: true
  }),
  ENVIRONMENT_MOVED: (messageParams) => ({
    message: `Environment ${messageParams.environmentUUID} was moved to the new location.`,
    log: true,
    loggerMessage: 'Environment was moved to the new location.',
    logPayload: messageParams,
    toastType: 'success',
    showToast: true
  })
};
