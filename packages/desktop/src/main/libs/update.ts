import { spawn } from 'child_process';
import { app, BrowserWindow, shell } from 'electron';
import { createWriteStream, promises as fsPromises } from 'fs';
import { join as pathJoin } from 'path';
import { gt as semverGt } from 'semver';
import { Config } from 'src/main/config';
import { logError, logInfo } from 'src/main/libs/logs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { ReadableStream } from 'stream/web';

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
  let releaseResponse: { tag: string };

  try {
    // try to remove existing old update
    await fsPromises.unlink(
      pathJoin(userDataPath, `mockoon.setup.${Config.appVersion}.exe`)
    );
    logInfo('[MAIN][UPDATE] Removed old update file');
  } catch (error) {}

  try {
    releaseResponse = await (
      await fetch(Config.latestReleaseDataURL, {
        headers: new Headers({
          pragma: 'no-cache',
          'cache-control': 'no-cache'
        })
      })
    ).json();
  } catch (error: any) {
    logInfo(`[MAIN][UPDATE] Error while checking for update: ${error.message}`);

    return;
  }

  const latestVersion = releaseResponse.tag;

  if (semverGt(latestVersion, Config.appVersion)) {
    logInfo(`[MAIN][UPDATE] Found a new version v${latestVersion}`);

    if (process.platform === 'win32' && isNotPortable) {
      const binaryFilename = `mockoon.setup.${latestVersion}.exe`;
      const updateFilePath = pathJoin(userDataPath, binaryFilename);

      try {
        await fsPromises.access(updateFilePath);
        logInfo('[MAIN][UPDATE] Binary file already downloaded');
        notifyUpdate(mainWindow);
        updateAvailableVersion = latestVersion;

        return;
      } catch (error) {}

      logInfo('[MAIN][UPDATE] Downloading binary file');

      try {
        const response = await fetch(
          `${Config.githubBinaryURL}v${latestVersion}/${binaryFilename}`
        );

        await finished(
          Readable.fromWeb(response.body as ReadableStream<any>).pipe(
            createWriteStream(updateFilePath)
          )
        );

        logInfo('[MAIN][UPDATE] Binary file ready');
        notifyUpdate(mainWindow);
        updateAvailableVersion = latestVersion;
      } catch (error: any) {
        logError(
          `[MAIN][UPDATE] Error while downloading the binary: ${error.message}`
        );
      }
    } else {
      notifyUpdate(mainWindow);
      updateAvailableVersion = latestVersion;
    }
  } else {
    logInfo('[MAIN][UPDATE] Application is up to date');
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
