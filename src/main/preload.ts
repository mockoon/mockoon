import { contextBridge, ipcRenderer } from 'electron';
import {
  IPCHandlerChannels,
  IPCListenerChannels
} from './constants/ipc.constants';

declare const isTesting: boolean;

const api = {
  send: (channel: string, ...data: any[]) => {
    if (IPCListenerChannels.includes(channel)) {
      ipcRenderer.send(channel, ...data);
    }
  },
  invoke: (channel: string, ...data: any[]) => {
    if (IPCHandlerChannels.includes(channel)) {
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

if (isTesting) {
  // contextIsolation will be disabled in a testing environment (spectron still relies on node integration and remote module, this `else` should be removed in the future)}
  (window as any).api = api;
} else {
  // contextIsolation will be true in a dev and prod env
  contextBridge.exposeInMainWorld('api', api);
}
