import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import { Config } from 'app/config';
import { AnalyticsService } from 'app/services/analytics.service';
import { shell } from 'electron';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import { Subject } from 'rxjs/Subject';
import * as semver from 'semver';
const https = require('https');
const fs = require('fs');
const app = require('electron').remote.app;
const spawn = require('child_process').spawn;
const platform = require('os').platform();

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
  private updateFilePath = app.getPath('userData') + '/';

  constructor(private http: Http, private analyticsService: AnalyticsService) {
    // always remove temp file
    this.removeTempFile();

    // avoid cache from AWS (cloudflare has a page rule for this)
    const headers = new Headers();
    headers.append('Cache-Control', 'no-cache');
    headers.append('Pragma', 'no-cache');
    const options = new RequestOptions({ headers });

    if (platform === 'darwin' || platform === 'linux' || platform === 'win32') {
      // request the updates.json file
      this.http.get(Config.updatesUrl, options)
        .map(response => response.json())
        .subscribe((updates) => {
          // check if version is ahead and trigger something depending on platform
          if (semver.gt(updates[platform].version, Config.version)) {
            this.nextVersion = updates[platform].version;

            // only trigger download for windows, for other just inform
            if (platform === 'win32') {
              const updateFileName = this.updateFileName[platform].replace('%v%', this.nextVersion);

              // if already have an update file
              if (fs.existsSync(this.updateFilePath + updateFileName)) {
                this.updateAvailable.next();
              } else {
                this.fileDownload(updates[platform].file, this.updateFilePath, updateFileName, () => {
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
    if (this.updateAvailable) {
      // launch exe detached and close app
      if (platform === 'win32') {
        spawn(this.updateFilePath + this.updateFileName[platform].replace('%v%', this.nextVersion), ['--updated'], { detached: true, stdio: 'ignore' }).unref();
        app.quit();
      } else if (platform === 'darwin' || platform === 'linux') {
        shell.openExternal(Config.releasesUrl + this.updateFileName[platform].replace('%v%', this.nextVersion));
      }
    }
  }

  /**
   * Generic file downloader
   */
  private fileDownload(url: string, destination: string, filename: string, callback: Function) {
    const file = fs.createWriteStream(destination + this.tempUpdateFileName);
    const request = https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          // rename when successful
          fs.rename(destination + this.tempUpdateFileName, destination + filename, callback);
        });
      });
    }).on('error', (error) => {
      fs.unlink(destination + this.tempUpdateFileName);
    });
  }

  /**
   * Remove update file corresponding to current version (for win only)
   */
  private removeOldUpdate() {
    if (platform === 'win32') {
      fs.unlink(this.updateFilePath + this.updateFileName[platform].replace('%v%', Config.version), () => { });
    }
  }

  /**
   * Remove the temporary update.download file (for win only)
   */
  private removeTempFile() {
    if (platform === 'win32') {
      fs.unlink(this.updateFilePath + this.tempUpdateFileName, () => { });
    }
  }
}
