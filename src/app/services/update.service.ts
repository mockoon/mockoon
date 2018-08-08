import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import { Config } from 'app/config';
import { shell } from 'electron';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import { Subject } from 'rxjs/Subject';
import * as semver from 'semver';
const request = require('request');
const fs = require('fs');
const app = require('electron').remote.app;
const spawn = require('child_process').spawn;
const platform = require('os').platform();
const packageJSON = require('../../../package.json');

/**
 * Auto update for windows (with temp file and old update file deletion)
 * Download trigger for mac and linux
 *
 */
@Injectable()
export class UpdateService {
  private tempUpdateFileName = 'update.download';
  private updateFileName = {
    win32: 'mockoon.setup.%v%.exe',
    darwin: 'mockoon.setup.%v%.dmg',
    linux: 'mockoon-%v%-x86_64.AppImage',
  };
  public updateAvailable: Subject<any> = new Subject();
  private nextVersion: string;
  private nextVersionFileName: string;
  private userDataPath = app.getPath('userData') + '/';

  constructor(private http: Http) {
    // always remove temp file
    this.removeTempFile();

    // avoid cache from AWS (cloudflare has a page rule for this)
    const headers = new Headers();
    headers.append('Cache-Control', 'no-cache');
    headers.append('Pragma', 'no-cache');
    const options = new RequestOptions({ headers });

    if (platform === 'darwin' || platform === 'linux' || platform === 'win32') {
      // request the updates.json file
      this.http.get(Config.githubLatestReleaseUrl, options)
        .map(response => response.json())
        .subscribe((githubRelease) => {
          // check if version is ahead and trigger something depending on platform (semver automatically strip 'v')
          if (semver.gt(githubRelease.tag_name, packageJSON.version)) {
            this.nextVersion = githubRelease.tag_name.replace('v', '');
            this.nextVersionFileName = this.updateFileName[platform].replace('%v%', this.nextVersion);

            // only trigger download for windows, for other just inform
            if (platform === 'win32') {
              // if already have an update file
              if (fs.existsSync(this.userDataPath + this.nextVersionFileName)) {
                this.updateAvailable.next();
              } else {
                this.fileDownload(`${Config.githubBinaryDownloadUrl}${githubRelease.tag_name}/${this.nextVersionFileName}`, this.userDataPath, this.nextVersionFileName, () => {
                  this.updateAvailable.next();
                });
              }
            } else {
              this.updateAvailable.next();
            }
          } else {
            this.removeOldUpdate();
          }
        });
    }
  }

  /**
   * Launch setup file and close the application
   */
  public applyUpdate() {
    if (this.nextVersion) {
      // launch exe detached and close app
      if (platform === 'win32') {
        spawn(this.userDataPath + this.nextVersionFileName, ['--updated'], { detached: true, stdio: 'ignore' }).unref();
        app.quit();
      } else if (platform === 'darwin' || platform === 'linux') {
        shell.openExternal(`${Config.githubBinaryDownloadUrl}v${this.nextVersion}/${this.nextVersionFileName}`);
      }
    }
  }

  /**
   * Generic file downloader
   */
  private fileDownload(url: string, destination: string, filename: string, callback: Function) {
    const file = fs.createWriteStream(destination + this.tempUpdateFileName);

    request.get(url).pipe(file).on('error', () => {
      fs.unlink(destination + this.tempUpdateFileName);
    }).on('finish', () => {
      // rename when successful
      fs.rename(destination + this.tempUpdateFileName, destination + filename, callback);
    });
  }

  /**
   * Remove update file corresponding to current version (for win only)
   */
  private removeOldUpdate() {
    if (platform === 'win32') {
      fs.unlink(this.userDataPath + this.updateFileName[platform].replace('%v%', packageJSON.version), () => { });
    }
  }

  /**
   * Remove the temporary update.download file (for win only)
   */
  private removeTempFile() {
    if (platform === 'win32') {
      fs.unlink(this.userDataPath + this.tempUpdateFileName, () => { });
    }
  }
}
