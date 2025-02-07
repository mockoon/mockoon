import { Environment } from '@mockoon/commons';
import { major } from 'semver';
import { MainAPIModel } from 'src/renderer/app/models/main-api.model';
import { Config } from 'src/renderer/config';
import { Settings } from 'src/shared/models/settings.model';

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

export const initMainApi = (): MainAPIModel => ({
  send: function (channel: string, ...data: any[]) {
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
        // noop
        case 'APP_LOGS':
        case 'APP_UPDATE_MENU_STATE':
        case 'APP_UPDATE_ENVIRONMENT':
        case 'APP_AUTH':
        case 'APP_AUTH_STOP_SERVER':
        case 'APP_APPLY_UPDATE':
        case 'APP_HIDE_WINDOW':
        case 'APP_ZOOM':
        case 'APP_SHOW_FILE':
        default:
          result = undefined;
          break;
      }

      resolve(result);
    });
  },
  invoke: function (channel: string, ...data: any[]) {
    return new Promise<any>((resolve) => {
      let result;

      switch (channel) {
        case 'APP_READ_ENVIRONMENT_DATA':
          result = readEnvironmentData(data[0] as string);
          break;
        case 'APP_WRITE_ENVIRONMENT_DATA':
          result = writeEnvironmentData(data[0] as Environment);
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

        case 'APP_GET_OS':
          // TODO do like before (darwin, etc)
          result = navigator.platform as string;
          break;

        // noop
        case 'APP_READ_CLIPBOARD':
        case 'APP_UNWATCH_FILE':
        case 'APP_UNWATCH_ALL_FILE':
        default:
          result = undefined;
          break;
      }

      resolve(result);
    });
  },
  receive: function () {}
});

/*

export const initIPCListeners = (mainWindow: BrowserWindow) => {
  // Quit requested by renderer (when waiting for save to finish)
  ipcMain.on('APP_QUIT', () => {
    // destroy the window otherwise app.quit() will trigger beforeunload again. Also there is no app.quit for macos
    mainWindow.destroy();
  });

  ipcMain.on('APP_SHOW_FOLDER', (event, name) => {
    showFolderInExplorer(name);
  });





  ipcMain.handle(
    'APP_READ_FILE',
    async (event, filePath) => await fsPromises.readFile(filePath, 'utf-8')
  );

  ipcMain.handle(
    'APP_WRITE_FILE',
    async (event, filePath, data) =>
      await fsPromises.writeFile(filePath, data, 'utf-8')
  );


  ipcMain.handle('APP_SHOW_OPEN_DIALOG', async (event, options) => {
    options.defaultPath = getDialogDefaultPath();

    if (IS_TESTING) {
      return { filePaths: [dialogMocks.open.pop()] };
    } else {
      return await dialog.showOpenDialog(mainWindow, options);
    }
  });

  ipcMain.handle('APP_SHOW_SAVE_DIALOG', async (event, options) => {
    if (!options.defaultPath) {
      options.defaultPath = getDialogDefaultPath();
    }

    if (IS_TESTING) {
      return { filePath: dialogMocks.save.pop() };
    } else {
      return await dialog.showSaveDialog(mainWindow, options);
    }
  });


  ipcMain.handle(
    'APP_GET_BASE_PATH',
    (event, filePath: string) => pathParse(filePath).dir
  );

  ipcMain.handle('APP_REPLACE_FILEPATH_EXTENSION', (event, filePath: string) =>
    pathFormat({ ...pathParse(filePath), base: '', ext: '.json' })
  );

  ipcMain.handle('APP_GET_MIME_TYPE', (event, filePath) =>
    mimeTypeLookup(filePath)
  );

  ipcMain.handle('APP_GET_FILENAME', (event, filePath) => {
    const parsedPath = pathParse(filePath);

    return parsedPath.name;
  });


  ipcMain.handle(
    'APP_OPENAPI_CONVERT_FROM',
    async (event, filePath: string, port?: number) => {
      const openApiConverter = new OpenAPIConverter();

      return await openApiConverter.convertFromOpenAPI(filePath, port);
    }
  );

  ipcMain.handle('APP_OPENAPI_CONVERT_TO', async (event, data: Environment) => {
    const openApiConverter = new OpenAPIConverter();

    return await openApiConverter.convertToOpenAPIV3(data);
  });

  ipcMain.handle(
    'APP_SERVER_GET_PROCESSED_DATABUCKET_VALUE',
    (event, environmentUuid: string, databucketUuid: string) =>
      ServerInstance.getProcessedDatabucketValue(
        environmentUuid,
        databucketUuid
      )
  );

  ipcMain.handle(
    'APP_START_SERVER',
    (event, environment: Environment, environmentPath: string) => {
      new ServerInstance(environment, environmentPath);
    }
  );

  ipcMain.handle('APP_STOP_SERVER', (event, uuid: string) => {
    ServerInstance.stop(uuid);
  });

  ipcMain.on(
    'APP_OPEN_FILE',
    async (event, filePath: string, relativeToFile: string) => {
      const result = await shell.openPath(
        buildFilePath(filePath, relativeToFile)
      );

      if (result) {
        logError(`Failed to open file in default editor: ${result}`);
      }
    }
  );
};

 */
