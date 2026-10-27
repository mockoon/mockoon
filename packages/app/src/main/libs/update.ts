import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { app, BrowserWindow, shell } from 'electron';
import {
  createReadStream,
  createWriteStream,
  promises as fsPromises
} from 'fs';
import { join as pathJoin } from 'path';
import { gt as semverGt } from 'semver';
import { Config } from 'src/main/config';
import { logError, logInfo } from 'src/main/libs/logs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { ReadableStream } from 'stream/web';

interface ReleaseResponse {
  tag: string;
  digest?: string;
}

let updateAvailableVersion: string;
const isNotPortable = !process.env['PORTABLE_EXECUTABLE_DIR'];

/**
 * Verify file SHA-256 checksum against expected hash
 */
const verifyFileSha256 = async (
  filePath: string,
  expectedHash: string
): Promise<boolean> => {
  try {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    for await (const chunk of stream) {
      hash.update(chunk);
    }

    const computedHash = hash.digest('hex');
    const normalizedExpected = expectedHash.replace(/^sha256:/i, '').trim();

    return computedHash.toLowerCase() === normalizedExpected.toLowerCase();
  } catch (error: any) {
    logError(`[MAIN][UPDATE] Error computing file checksum: ${error.message}`);

    return false;
  }
};

/**
 * Tell the renderer that an update is available.
 * dom-ready may have been fired already or not.
 * APP_UPDATE_AVAILABLE can be emitted safely twice.
 *
 * @param mainWindow
 */
const notifyUpdate = (mainWindow: BrowserWindow, version: string) => {
  mainWindow.webContents.send('APP_UPDATE_AVAILABLE', version);

  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.send('APP_UPDATE_AVAILABLE', version);
  });
};

export const checkForUpdate = async (mainWindow: BrowserWindow) => {
  const userDataPath = app.getPath('userData');
  let releaseResponse: ReleaseResponse;

  try {
    // try to remove existing old update
    await fsPromises.unlink(
      pathJoin(userDataPath, `mockoon.setup.${Config.appVersion}.exe`)
    );
    logInfo('[MAIN][UPDATE] Removed old update file');
  } catch (_error) {}

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

      if (!releaseResponse.digest) {
        logError(
          '[MAIN][UPDATE] No sha256 found in release metadata. Aborting update for security.'
        );

        return;
      }

      try {
        await fsPromises.access(updateFilePath);
        logInfo(
          '[MAIN][UPDATE] Binary file already downloaded, verifying checksum'
        );
        const isValid = await verifyFileSha256(
          updateFilePath,
          releaseResponse.digest
        );

        if (isValid) {
          logInfo('[MAIN][UPDATE] Existing binary file checksum verified');
          notifyUpdate(mainWindow, latestVersion);
          updateAvailableVersion = latestVersion;

          return;
        } else {
          logError(
            '[MAIN][UPDATE] Existing binary file checksum mismatch. Deleting file.'
          );
          await fsPromises.unlink(updateFilePath);
        }
      } catch (_error) {}

      logInfo('[MAIN][UPDATE] Downloading binary file');

      try {
        const response = await fetch(
          `${Config.githubBinaryURL}v${latestVersion}/${binaryFilename}`
        );

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        await finished(
          Readable.fromWeb(response.body as ReadableStream<any>).pipe(
            createWriteStream(updateFilePath)
          )
        );

        logInfo('[MAIN][UPDATE] Download finished, verifying checksum');
        const isValid = await verifyFileSha256(
          updateFilePath,
          releaseResponse.digest
        );

        if (!isValid) {
          logError(
            '[MAIN][UPDATE] Downloaded binary checksum mismatch! Deleting file.'
          );
          try {
            await fsPromises.unlink(updateFilePath);
          } catch (_e) {}

          return;
        }

        logInfo('[MAIN][UPDATE] Binary file verified and ready');
        notifyUpdate(mainWindow, latestVersion);
        updateAvailableVersion = latestVersion;
      } catch (error: any) {
        logError(
          `[MAIN][UPDATE] Error while downloading the binary: ${error.message}`
        );
        try {
          await fsPromises.unlink(updateFilePath);
        } catch (_e) {}
      }
    } else {
      notifyUpdate(mainWindow, latestVersion);
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
