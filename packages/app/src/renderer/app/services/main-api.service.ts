import { Injectable } from '@angular/core';
import { Environment } from '@mockoon/commons';
import { major } from 'semver';
import { MainAPIModel } from 'src/renderer/app/models/main-api.model';
import { Config } from 'src/renderer/config';
import { Settings } from 'src/shared/models/settings.model';

const deleteEnvironmentData = (uuid: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mockoon-db', major(Config.appVersion));

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['environments'], 'readwrite');
      const store = transaction.objectStore('environments');
      const deleteRequest = store.delete(uuid);

      deleteRequest.onsuccess = () => {
        resolve();
      };
      deleteRequest.onerror = (event) => {
        reject((event.target as any).error);
      };

      transaction.oncomplete = () => db.close();
    };

    request.onerror = (event) => {
      reject((event.target as any).error);
    };
  });
};

const writeEnvironmentData = (environment: Environment): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mockoon-db', major(Config.appVersion));

    request.onupgradeneeded = (event) => {
      console.log('onupgradeneeded');
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('environments')) {
        db.createObjectStore('environments', { keyPath: 'uuid' }); // Ensure a keyPath
      }
    };

    request.onsuccess = (event) => {
      console.log('onsuccess');
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['environments'], 'readwrite');

      transaction.oncomplete = () => db.close();
      transaction.onerror = (event) => {
        reject((event.target as any).error);
      };

      const store = transaction.objectStore('environments');
      const addRequest = store.put(environment);

      addRequest.onsuccess = () => {
        resolve();
      };
      addRequest.onerror = (event) => {
        reject((event.target as any).error);
      };
    };

    request.onerror = (event) => {
      reject((event.target as any).error);
    };
  });
};

const readEnvironmentData = (
  uuid: string
): Promise<Environment | undefined> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mockoon-db', major(Config.appVersion));

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['environments'], 'readonly');
      const store = transaction.objectStore('environments');
      const getRequest = store.get(uuid);

      getRequest.onsuccess = (event) => {
        resolve((event.target as any).result);
      };
      getRequest.onerror = (event) => {
        reject((event.target as any).error);
      };

      transaction.oncomplete = () => db.close();
    };

    request.onerror = (event) => {
      reject((event.target as any).error);
    };
  });
};

/**
 * Main API service used to emulate Electron's main process in the web version
 *
 * Some methods are noops as they are not needed in the web version
 *
 */
@Injectable({ providedIn: 'root' })
export class MainApiService implements MainAPIModel {
  public invoke(channel: string, ...data: any[]) {
    return new Promise<any>((resolve) => {
      let result;

      switch (channel) {
        case 'APP_READ_ENVIRONMENT_DATA':
          result = readEnvironmentData(data[0] as string);
          break;
        case 'APP_WRITE_ENVIRONMENT_DATA':
          result = writeEnvironmentData(data[0] as Environment);
          break;
        case 'APP_DELETE_ENVIRONMENT_DATA':
          result = deleteEnvironmentData(data[0] as string);
          break;
        case 'APP_READ_SETTINGS_DATA':
          result = JSON.parse(localStorage.getItem('appSettings')) as Settings;
          break;
        case 'APP_WRITE_SETTINGS_DATA':
          result = localStorage.setItem('appSettings', JSON.stringify(data[0]));
          break;
        case 'APP_BUILD_STORAGE_FILEPATH':
          result = data[0] as string;
          break;
        case 'APP_GET_HASH':
          {
            const msgUint8 = new TextEncoder().encode(data[0]);

            result = window.crypto.subtle
              .digest('SHA-1', msgUint8)
              .then((hashBuffer) => {
                const hashArray = Array.from(new Uint8Array(hashBuffer));

                return hashArray
                  .map((b) => b.toString(16).padStart(2, '0'))
                  .join('');
              });
          }
          break;

        case 'APP_GET_OS': {
          // use same names as in electron
          const platform: string = (
            navigator?.['userAgentData']?.platform ??
            navigator.platform ??
            'unknown'
          ).toLowerCase();

          if (platform.includes('win')) {
            result = 'win32';
          } else if (platform.includes('mac')) {
            result = 'darwin';
          } else if (platform.includes('linux')) {
            result = 'linux';
          } else {
            result = 'unknown';
          }
          break;
        }

        default:
          result = undefined;
          break;
      }

      resolve(result);
    });
  }

  public send(channel: string, ...data: any[]) {
    return new Promise<any>((resolve) => {
      let result;

      switch (channel) {
        case 'APP_WRITE_CLIPBOARD':
          {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(data[0]);
            }
          }
          break;

        default:
          result = undefined;
          break;
      }

      resolve(result);
    });
  }

  public receive(_channel: string, _callback: (...args: any[]) => void) {
    /* noop */
  }
}
