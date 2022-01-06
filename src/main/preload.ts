import { contextBridge, ipcRenderer } from 'electron';
import {
  IPCMainHandlerChannels,
  IPCMainListenerChannels,
  IPCRendererHandlerChannels
} from './constants/ipc.constants';

const api = {
  send: (channel: string, ...data: any[]) => {
    if (IPCMainListenerChannels.includes(channel)) {
      ipcRenderer.send(channel, ...data);
    }
  },
  invoke: (channel: string, ...data: any[]) => {
    if (IPCMainHandlerChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...data);
    }

    return Promise.reject('Invalid channel');
  },
  receive: (channel: string, callback: (...args: any[]) => any) => {
    if (IPCRendererHandlerChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  }
};

contextBridge.exposeInMainWorld('api', api);
