import {
  MessageCodes,
  MessageParams
} from 'src/renderer/app/models/messages.model';
import { ToastTypes } from 'src/renderer/app/models/toasts.model';

export const Messages: {
  [key in MessageCodes]:
    | ((
        messageParams: MessageParams
      ) => {
        message: string;
        loggerMessage?: string;
        showToast: false;
      })
    | ((
        messageParams: MessageParams
      ) => {
        message: string;
        loggerMessage?: string;
        showToast: true;
        toastType: ToastTypes;
      });
} = {
  CREATING_PROXY: (messageParams) => ({
    message: `Creating proxy between localhost:${messageParams.port} and ${messageParams.proxyHost}`,
    showToast: false,
    toastType: ''
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
    message: 'This port is invalid',
    loggerMessage: `Error when starting the server ${messageParams.uuid}: ${messageParams.error.message}`,
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
  EXPORT_SUCCESS: () => ({
    message: 'Environments have been successfully exported',
    showToast: true,
    toastType: 'success'
  }),
  EXPORT_SELECTED_SUCCESS: () => ({
    message: 'Environment has been successfully exported',
    showToast: true,
    toastType: 'success'
  }),
  EXPORT_ENVIRONMENT_CLIPBOARD_SUCCESS: () => ({
    message: 'Environment has been successfully copied to the clipboard',
    showToast: true,
    toastType: 'success'
  }),
  EXPORT_ROUTE_CLIPBOARD_SUCCESS: () => ({
    message: 'Route has been successfully copied to the clipboard',
    showToast: true,
    toastType: 'success'
  })
};
