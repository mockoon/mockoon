import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import chaiExclude from 'chai-exclude';
import { copyFile } from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import { Application } from 'spectron';
import { Helpers } from 'test/lib/helpers';

const electronPath: any = require('electron');

export class Tests {
  public app: Application;
  public helpers: Helpers;

  constructor(private dataFileName: string, private customSettings = false) {
    this.helpers = new Helpers(this);
    chai.should();
    chai.use(chaiAsPromised);
    chai.use(chaiExclude);
  }

  /**
   * Before and after hooks to run prior to the tests
   */
  public runHooks(
    waitUntilWindowReady = true,
    waitUntilEnvironmentLoaded = true
  ) {
    // copy data files before starting tests
    before(() => {
      return new Promise(async (resolve) => {
        await mkdirp('./tmp/storage/');

        copyFile(
          './test/data/' + this.dataFileName + '/environments.json',
          './tmp/storage/environments.json',
          () => {
            copyFile(
              './test/data/' +
                (this.customSettings ? this.dataFileName + '/' : '') +
                'settings.json',
              './tmp/storage/settings.json',
              () => {
                resolve();
              }
            );
          }
        );
      });
    });

    before(() => {
      this.app = new Application({
        path: electronPath,
        args: [
          '-r',
          path.join(__dirname, './electron-mocks.js'),
          './dist',
          '--tests'
        ],
        webdriverOptions: {
          deprecationWarnings: false
        }
      });

      return this.app.start();
    });

    after(() => {
      if (this.app && this.app.isRunning()) {
        return this.app.stop();
      }

      return undefined;
    });

    if (waitUntilWindowReady) {
      this.waitForWindowReady();
    }

    if (waitUntilEnvironmentLoaded) {
      this.waitForEnvironmentLoaded();
    }
  }

  /**
   * Wait for window to be ready and environments loaded
   */
  public waitForWindowReady() {
    it('Should wait for window to be ready', async () => {
      await this.app.client.waitUntilWindowLoaded();
    });
  }

  /**
   * Wait for environement to be loaded by checking for active environment menu item
   */
  public waitForEnvironmentLoaded() {
    it('Should load the environment', async () => {
      await this.helpers.assertHasActiveEnvironment();
    });
  }
}
