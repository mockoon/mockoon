import { MainAPIModel } from 'src/renderer/app/models/main-api.model';
import { Settings } from 'src/shared/models/settings.model';

export const initMainApi = (): MainAPIModel => ({
  send: function () {},
  invoke: function (channel: string, ...data: any[]) {
    return new Promise<any>((resolve) => {
      let result;

      switch (channel) {
        case 'APP_READ_SETTINGS_DATA':
          result = JSON.parse(localStorage.getItem('appSettings')) as Settings;
          break;
        case 'APP_WRITE_SETTINGS_DATA':
          result = localStorage.setItem('appSettings', JSON.stringify(data[0]));
          break;
        case 'APP_BUILD_STORAGE_FILEPATH':
          result = data[0] as string;
          break;

        case 'APP_GET_OS':
          result = navigator.platform as string;
          break;

        // noop
        case 'APP_UNWATCH_FILE':
        case 'APP_UNWATCH_ALL_FILE':
        case 'APP_UPDATE_MENU_STATE':
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

  ipcMain.on('APP_HIDE_WINDOW', () => {
    mainWindow.hide();
  });

  ipcMain.on('APP_LOGS', (event, data) => {
    if (data.type === 'info') {
      logInfo(data.message, data.payload);
    } else if (data.type === 'error') {
      logError(data.message, data.payload);
    }
  });

  ipcMain.on('APP_SHOW_FILE', (event, filePath, relativeToFile) => {
    shell.showItemInFolder(buildFilePath(filePath, relativeToFile));
  });

  ipcMain.on('APP_SHOW_FOLDER', (event, name) => {
    showFolderInExplorer(name);
  });

  ipcMain.on('APP_AUTH', (event, page) => {
    startAuthCallbackServer(page);
  });

  ipcMain.on('APP_AUTH_STOP_SERVER', () => {
    stopAuthCallbackServer();
  });

  ipcMain.on('APP_WRITE_CLIPBOARD', async (event, data) => {
    clipboard.writeText(data, 'clipboard');
  });

  ipcMain.on('APP_UPDATE_ENVIRONMENT', (event, environments: Environments) => {
    ServerInstance.updateEnvironments(environments);
  });

  ipcMain.on('APP_APPLY_UPDATE', () => {
    applyUpdate();
  });

  ipcMain.on('APP_ZOOM', (event, action: 'IN' | 'OUT' | 'RESET') => {
    if (action === 'IN') {
      handleZoomIn(mainWindow);
    } else if (action === 'OUT') {
      handleZoomOut(mainWindow);
    } else if (action === 'RESET') {
      handleZoomReset(mainWindow);
    }
  });



  ipcMain.handle(
    'APP_READ_ENVIRONMENT_DATA',
    async (event, path: string) => await readJSONData(path)
  );

  ipcMain.handle(
    'APP_WRITE_ENVIRONMENT_DATA',
    async (
      event,
      data,
      descriptor: EnvironmentDescriptor,
      storagePrettyPrint?: boolean
    ) => {
      if (!descriptor.cloud) {
        unwatchEnvironmentFile(data.uuid);
      }

      await writeJSONData(data, descriptor.path, storagePrettyPrint);

      if (!descriptor.cloud) {
        watchEnvironmentFile(data.uuid, descriptor.path);
      }
    }
  );

  ipcMain.handle(
    'APP_READ_FILE',
    async (event, filePath) => await fsPromises.readFile(filePath, 'utf-8')
  );

  ipcMain.handle(
    'APP_WRITE_FILE',
    async (event, filePath, data) =>
      await fsPromises.writeFile(filePath, data, 'utf-8')
  );

  ipcMain.handle('APP_READ_CLIPBOARD', async () =>
    clipboard.readText('clipboard')
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

  ipcMain.handle('APP_GET_HASH', (event, str) =>
    createHash('sha1').update(str, 'utf-8').digest('hex')
  );

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
