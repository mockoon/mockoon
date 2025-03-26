import { Injectable } from '@angular/core';
import { Environment } from '@mockoon/commons';
import { MainAPIModel } from 'src/renderer/app/models/main-api.model';
import { Settings } from 'src/shared/models/settings.model';

/**
 * Main API service used to emulate calls to Electron's main process (preload + ipc.ts) in the web version
 *
 * Some methods are noops as they are not needed in the web version
 *
 */
@Injectable({ providedIn: 'root' })
export class MainApiService implements MainAPIModel {
  private dbName = 'mockoon-db';
  // version can be always 1 as migrations are handled by the environment schema/migrationId
  // Also, the web app is always up to date with the latest schema and first user to connect migrates the envs
  private dbVersion = 1;
  private environmentStoreName = 'environments';

  public invoke(channel: string, ...data: any[]) {
    return new Promise<any>((resolve) => {
      let result;

      switch (channel) {
        case 'APP_READ_ENVIRONMENT_DATA':
          result = this.readEnvironmentData(data[0] as string);
          break;
        case 'APP_WRITE_ENVIRONMENT_DATA':
          result = this.writeEnvironmentData(data[0] as Environment);
          break;
        case 'APP_DELETE_ENVIRONMENT_DATA':
          result = this.deleteEnvironmentData(data[0] as string);
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

        case 'APP_LOGS':
          if (data[0].type === 'error') {
            // eslint-disable-next-line no-console
            console.error(data[0].message);
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

  private connectToIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open(this.dbName, this.dbVersion);

      openRequest.onupgradeneeded = (openRequestEvent) => {
        const db = (openRequestEvent.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.environmentStoreName)) {
          db.createObjectStore(this.environmentStoreName, { keyPath: 'uuid' });
        }
      };

      openRequest.onsuccess = (openRequestEvent) => {
        resolve((openRequestEvent.target as IDBOpenDBRequest).result);
      };

      openRequest.onerror = (openRequestErrorEvent) => {
        reject((openRequestErrorEvent.target as any).error);
      };
    });
  }

  /**
   * Delete an environment from IndexedDB
   *
   * @param environmentUuid
   * @returns
   */
  private async deleteEnvironmentData(environmentUuid: string): Promise<void> {
    const db = await this.connectToIndexedDB();

    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [this.environmentStoreName],
        'readwrite'
      );
      const store = transaction.objectStore(this.environmentStoreName);
      const deleteRequest = store.delete(environmentUuid);

      deleteRequest.onsuccess = () => {
        resolve();
      };
      deleteRequest.onerror = (event) => {
        reject((event.target as any).error);
      };

      transaction.oncomplete = () => db.close();
    });
  }

  /**
   * Write Environment Data to IndexedDB
   *
   * @param environment
   * @returns
   */
  private async writeEnvironmentData(environment: Environment): Promise<void> {
    const db = await this.connectToIndexedDB();

    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [this.environmentStoreName],
        'readwrite'
      );

      transaction.oncomplete = () => db.close();
      transaction.onerror = (event) => {
        reject((event.target as any).error);
      };

      const store = transaction.objectStore(this.environmentStoreName);
      const addRequest = store.put(environment);

      addRequest.onsuccess = () => {
        resolve();
      };
      addRequest.onerror = (event_1) => {
        reject((event_1.target as any).error);
      };
    });
  }

  /**
   * Read Environment Data from IndexedDB
   *
   * @param uuid
   * @returns
   */
  private async readEnvironmentData(
    uuid: string
  ): Promise<Environment | undefined> {
    const db = await this.connectToIndexedDB();

    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [this.environmentStoreName],
        'readonly'
      );
      const store = transaction.objectStore(this.environmentStoreName);
      const getRequest = store.get(uuid);

      getRequest.onsuccess = (event) => {
        resolve((event.target as any).result);
      };
      getRequest.onerror = (event_1) => {
        reject((event_1.target as any).error);
      };

      transaction.oncomplete = () => db.close();
    });
  }
}
