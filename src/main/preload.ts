import { contextBridge, ipcRenderer } from 'electron';

const api = {
  send: (channel: string, ...data: any[]) => {
    const validChannels = [
      'APP_DISABLE_EXPORT',
      'APP_ENABLE_EXPORT',
      'APP_OPEN_EXTERNAL_LINK',
      'APP_WRITE_CLIPBOARD',
      'APP_QUIT',
      'APP_LOGS',
      'APP_SET_FAKER_OPTIONS',
      'APP_UPDATE_ENVIRONMENT',
      'APP_APPLY_UPDATE'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...data);
    }
  },
  invoke: (channel: string, ...data: any[]) => {
    const validChannels = [
      'APP_READ_JSON_DATA',
      'APP_WRITE_JSON_DATA',
      'APP_READ_CLIPBOARD',
      'APP_SHOW_OPEN_DIALOG',
      'APP_SHOW_SAVE_DIALOG',
      'APP_GET_PLATFORM',
      'APP_GET_MIME_TYPE',
      'APP_READ_FILE',
      'APP_WRITE_FILE',
      'APP_OPENAPI_VALIDATE',
      'APP_OPENAPI_DEREFERENCE',
      'APP_START_SERVER',
      'APP_STOP_SERVER'
    ];

    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...data);
    }

    return Promise.reject('Invalid channel');
  },
  receive: (channel: string, callback: (...args: any[]) => any) => {
    const validChannels = [
      'APP_MENU',
      'APP_SERVER_EVENT',
      'APP_UPDATE_AVAILABLE'
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  }
};

// contextIsolationEnabled should be true in a dev and prod env
if ((contextBridge as any).internalContextBridge?.contextIsolationEnabled) {
  contextBridge.exposeInMainWorld('api', api);
} else {
  // contextIsolationEnabled should be at false in a testing environment (spectron still relies on node integration and remote module, this else should be removed in the future)
  (window as any).electronRequire = require;
  (window as any).api = api;
}
