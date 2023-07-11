import axios from 'axios';
import { spawn } from 'child_process';
import { app, BrowserWindow, shell } from 'electron';
import { error as logError, info as logInfo } from 'electron-log';
import { createWriteStream, promises as fsPromises } from 'fs';
import { join as pathJoin } from 'path';
import { gt as semverGt } from 'semver';
import { Config } from 'src/main/config';
import { pipeline } from 'stream';
import { promisify } from 'util';

let updateAvailableVersion: string;
const isNotPortable = !process.env.PORTABLE_EXECUTABLE_DIR;

/**
 * Tell the renderer that an update is available.
 * dom-ready may have been fired already or not.
 * APP_UPDATE_AVAILABLE can be emitted safely twice.
 *
 * @param mainWindow
 */
const notifyUpdate = (mainWindow: BrowserWindow) => {
  mainWindow.webContents.send('APP_UPDATE_AVAILABLE');

  mainWindow.webContents.once('dom-ready', () => {
    mainWindow.webContents.send('APP_UPDATE_AVAILABLE');
  });
};

export const checkForUpdate = async (mainWindow: BrowserWindow) => {
  const userDataPath = app.getPath('userData');
  const streamPipeline = promisify(pipeline);
  let releaseResponse: { data: { tag: string } };

  try {
    // try to remove existing old update
    await fsPromises.unlink(
      pathJoin(userDataPath, `mockoon.setup.${Config.appVersion}.exe`)
    );
    logInfo('[MAIN][UPDATE]Removed old update file');
  } catch (error) {}

  try {
    releaseResponse = await axios.get(Config.latestReleaseDataURL, {
      headers: { pragma: 'no-cache', 'cache-control': 'no-cache' }
    });
  } catch (error: any) {
    logError(`[MAIN][UPDATE]Error while checking for update: ${error.message}`);

    return;
  }

  const latestVersion = releaseResponse.data.tag;

  if (semverGt(latestVersion, Config.appVersion)) {
    logInfo(`[MAIN][UPDATE]Found a new version v${latestVersion}`);

    if (process.platform === 'win32' && isNotPortable) {
      const binaryFilename = `mockoon.setup.${latestVersion}.exe`;
      const updateFilePath = pathJoin(userDataPath, binaryFilename);

      try {
        await fsPromises.access(updateFilePath);
        logInfo('[MAIN][UPDATE]Binary file already downloaded');
        notifyUpdate(mainWindow);
        updateAvailableVersion = latestVersion;

        return;
      } catch (error) {}

      logInfo('[MAIN][UPDATE]Downloading binary file');

      try {
        const response = await axios.get(
          `${Config.githubBinaryURL}v${latestVersion}/${binaryFilename}`,
          { responseType: 'stream' }
        );
        await streamPipeline(response.data, createWriteStream(updateFilePath));
        logInfo('[MAIN][UPDATE]Binary file ready');
        notifyUpdate(mainWindow);
        updateAvailableVersion = latestVersion;
      } catch (error: any) {
        logError(
          `[MAIN][UPDATE]Error while downloading the binary: ${error.message}`
        );
      }
    } else {
      notifyUpdate(mainWindow);
      updateAvailableVersion = latestVersion;
    }
  } else {
    logInfo('[MAIN][UPDATE]Application is up to date');
  }
};

export const applyUpdate = () => {
  const userDataPath = app.getPath('userData');

  if (updateAvailableVersion) {
    if (process.platform === 'win32' && isNotPortable) {
      spawn(
        pathJoin(userDataPath, `mockoon.setup.${updateAvailableVersion}.exe`),
        ['--updated'],
        {
          detached: true,
          stdio: 'ignore'
        }
      ).unref();

      app.quit();
    } else {
      shell.openExternal('https://mockoon.com/download');
    }
  }
};
