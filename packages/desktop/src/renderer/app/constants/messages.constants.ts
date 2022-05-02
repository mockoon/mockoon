import {
  MessageCodes,
  MessageParams
} from 'src/renderer/app/models/messages.model';
import { ToastTypes } from 'src/renderer/app/models/toasts.model';

export const Messages: {
  [key in MessageCodes]:
    | ((messageParams: MessageParams) => {
        message: string;
        loggerMessage?: string;
        showToast: false;
      })
    | ((messageParams: MessageParams) => {
        message: string;
        loggerMessage?: string;
        showToast: true;
        toastType: ToastTypes;
      });
} = {
  INITIALIZING_APP: () => ({
    message: 'Initializing application',
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
      showToast: false
    };
  },
  CREATING_PROXY: (messageParams) => ({
    message: `Creating proxy between localhost:${messageParams.port} and ${messageParams.proxyHost}`,
    showToast: false
  }),
  ENVIRONMENT_STARTED: (messageParams) => ({
    message: `Server ${messageParams.uuid} was started successfully on port ${messageParams.port}`,
    showToast: false
  }),
  ENVIRONMENT_STOPPED: (messageParams) => ({
    message: `Server ${messageParams.uuid} has been stopped`,
    showToast: false
  }),
  PORT_ALREADY_USED: (messageParams) => {
    const message = `Port ${messageParams.port} is already in use`;

    return {
      message,
      loggerMessage: `Error when starting the server ${messageParams.uuid}: ${messageParams.error.message}`,
      showToast: true,
      toastType: 'error'
    };
  },
  PORT_INVALID: (messageParams) => ({
    message: 'This port is invalid or access is denied',
    loggerMessage: `Error when starting the server ${messageParams.uuid}: ${messageParams.error.message}`,
    showToast: true,
    toastType: 'error'
  }),
  HOSTNAME_UNAVAILABLE: (messageParams) => ({
    message: 'Provided hostname/address not available',
    loggerMessage: `Error when starting the server ${messageParams.uuid}: ${messageParams.error.message}`,
    showToast: true,
    toastType: 'error'
  }),
  HOSTNAME_UNKNOWN: (messageParams) => ({
    message: 'Unknown hostname/address provided',
    loggerMessage: `Error getting address information ${messageParams.uuid}: ${messageParams.error.message}`,
    showToast: true,
    toastType: 'error'
  }),
  CERT_FILE_NOT_FOUND: (messageParams) => ({
    message: `Certificate file not found: ${messageParams.error.message}`,
    showToast: true,
    toastType: 'error'
  }),
  REQUEST_BODY_PARSE: (messageParams) => {
    const message = `Error while parsing entering body: ${messageParams.error.message}`;

    return {
      message,
      loggerMessage: message,
      showToast: true,
      toastType: 'error'
    };
  },
  ROUTE_CREATION_ERROR: (messageParams) => ({
    message: `Error while creating the route: ${messageParams.error.message}`,
    showToast: false
  }),
  ROUTE_CREATION_ERROR_REGEX: (messageParams) => ({
    message: `This route regex path is invalid: ${messageParams.error.message}`,
    loggerMessage: `Error while creating the route: ${messageParams.error.message}`,
    showToast: true,
    toastType: 'error'
  }),
  ROUTE_SERVING_ERROR: (messageParams) => ({
    message: `Error while serving the content: ${messageParams.error.message}`,
    showToast: false
  }),
  ROUTE_FILE_SERVING_ERROR: (messageParams) => ({
    message: `Error while serving the file content: ${messageParams.error.message}`,
    showToast: false
  }),
  PROXY_ERROR: (messageParams) => ({
    message: `An error occured while trying to proxy to ${messageParams.proxyHost}: ${messageParams.error.message}`,
    showToast: false
  }),
  UNKNOWN_SERVER_ERROR: (messageParams) => ({
    message: `Server error: ${messageParams.error.message}`,
    loggerMessage: `Error when starting the server ${messageParams.uuid}: ${messageParams.error.message}`,
    showToast: true,
    toastType: 'error'
  }),
  OPENAPI_EXPORT: (messageParams) => ({
    message: `Exporting environment ${messageParams.environmentUUID} to OpenAPI format`,
    showToast: false
  }),
  OPENAPI_EXPORT_SUCCESS: (messageParams) => ({
    message: `Environment ${messageParams.environmentName} has been successfully exported`,
    showToast: true,
    toastType: 'success'
  }),
  OPENAPI_EXPORT_ERROR: (messageParams) => ({
    message: `Error while exporting environment to OpenAPI format: ${messageParams.error.message}`,
    loggerMessage: `Error while exporting environment ${messageParams.environmentUUID} to OpenAPI format: ${messageParams.error.message}`,
    showToast: true,
    toastType: 'error'
  }),
  OPENAPI_IMPORT: (messageParams) => ({
    message: `Importing environment ${messageParams.filePath} from OpenAPI format`,
    showToast: false
  }),
  OPENAPI_IMPORT_SUCCESS: (messageParams) => ({
    message: `Environment "${messageParams.environmentName}" has been successfully imported`,
    showToast: true,
    toastType: 'success'
  }),
  OPENAPI_IMPORT_ERROR: (messageParams) => ({
    message: `Error while importing environment from OpenAPI format: ${messageParams.error.message}`,
    loggerMessage: `Error while importing environment ${messageParams.filePath} from OpenAPI format: ${messageParams.error.message}`,
    showToast: true,
    toastType: 'error'
  }),
  COPY_ENVIRONMENT_CLIPBOARD: (messageParams) => ({
    message: `Copying environment ${messageParams.environmentUUID} to the clipboard`,
    showToast: false
  }),
  COPY_ENVIRONMENT_CLIPBOARD_SUCCESS: (messageParams) => ({
    message: 'Environment has been successfully copied to the clipboard',
    loggerMessage: `Environment ${messageParams.environmentUUID} has been successfully copied to the clipboard`,
    showToast: true,
    toastType: 'success'
  }),
  COPY_ENVIRONMENT_CLIPBOARD_ERROR: (messageParams) => ({
    message: `An error occured while copying the environment to the clipboard: ${messageParams.error.message}`,
    showToast: true,
    toastType: 'error'
  }),
  COPY_ROUTE_CLIPBOARD: (messageParams) => ({
    message: `Copying route ${messageParams.routeUUID} to the clipboard`,
    showToast: false
  }),
  COPY_ROUTE_CLIPBOARD_SUCCESS: (messageParams) => ({
    message: 'Route has been successfully copied to the clipboard',
    loggerMessage: `Route ${messageParams.routeUUID} has been successfully copied to the clipboard`,
    showToast: true,
    toastType: 'success'
  }),
  COPY_ROUTE_CLIPBOARD_ERROR: (messageParams) => ({
    message: `An error occured while copying the route to the clipboard: ${messageParams.error.message}`,
    showToast: true,
    toastType: 'error'
  }),
  NEW_ENVIRONMENT_FROM_URL: (messageParams) => ({
    message: `Importing environment from URL: ${messageParams.url}`,
    showToast: false
  }),
  NEW_ENVIRONMENT_CLIPBOARD_ERROR: (messageParams) => ({
    message: `Error while loading environment from clipboard: ${messageParams.error.message}`,
    showToast: true,
    toastType: 'error'
  }),
  NEW_ENVIRONMENT_URL_ERROR: (messageParams) => ({
    message: `Error while loading environment from URL: ${messageParams.error.message}`,
    showToast: true,
    toastType: 'error'
  }),
  NEW_ROUTE_CLIPBOARD_ERROR: (messageParams) => ({
    message: `Error while loading route from clipboard: ${messageParams.error.message}`,
    showToast: true,
    toastType: 'error'
  }),
  ENVIRONMENT_FILE_IN_USE: () => ({
    message: 'This environment file is already in use',
    showToast: true,
    toastType: 'error'
  }),
  FIRST_LOAD_DEMO_ENVIRONMENT: () => ({
    message: 'First load, adding demo environment',
    showToast: false
  }),
  ENVIRONMENT_MORE_RECENT_VERSION: (messageParams) => ({
    message: `Environment "${
      messageParams.name || messageParams.uuid
    }" was created with a more recent version of Mockoon. Please upgrade.`,
    showToast: true,
    toastType: 'warning'
  }),
  ENVIRONMENT_IS_EXPORT_FILE: () => ({
    message: 'This file is an export file. Please import it.',
    showToast: true,
    toastType: 'warning'
  }),
  ENVIRONMENT_MIGRATION_FAILED: (messageParams) => ({
    message: `Migration of environment "${
      messageParams.name || messageParams.uuid
    }" failed. The environment was automatically repaired and migrated to the latest version.`,
    showToast: true,
    toastType: 'warning'
  }),
  STORAGE_LOAD_ERROR: (messageParams) => ({
    message: `Error while loading ${messageParams.path}. Please restart the application.`,
    loggerMessage: `Error while loading ${messageParams.path}: ${
      messageParams.error.code || ''
    } ${messageParams.error.message || ''}`,
    showToast: true,
    toastType: 'error'
  }),
  STORAGE_SAVE_ERROR: (messageParams) => ({
    message: `Error while saving ${messageParams.path}. If the problem persists please restart the application.`,
    loggerMessage: `Error while saving ${messageParams.path}: ${
      messageParams.error.code || ''
    } ${messageParams.error.message || ''}`,
    showToast: true,
    toastType: 'error'
  }),
  MIGRATING_ENVIRONMENT: (messageParams) => ({
    message: `Migrating environment ${messageParams.environmentUUID} starting at ${messageParams.migrationStartId}`,
    showToast: false
  })
};
