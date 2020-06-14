import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import chaiExclude from 'chai-exclude';
import { promises as fs } from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import { Application } from 'spectron';
import { Settings } from 'src/app/models/settings.model';
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
    waitUntilEnvironmentLoaded = true,
    alterSettings = null
  ) {
    // copy data files before starting tests
    before(async () => {
      const settingsFilePath = './tmp/storage/settings.json';
      await mkdirp('./tmp/storage/');

      await fs.copyFile(
        './test/data/' + this.dataFileName + '/environments.json',
        './tmp/storage/environments.json'
      );
      await fs.copyFile(
        './test/data/' +
          (this.customSettings ? this.dataFileName + '/' : '') +
          'settings.json',
        settingsFilePath
      );

      if (alterSettings) {
        const settingsFile = await fs.readFile(settingsFilePath, 'utf-8');
        let settings: Settings = JSON.parse(settingsFile);
        settings = { ...settings, ...alterSettings };
        await fs.writeFile(settingsFilePath, JSON.stringify(settings));
      }

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

      await this.app.start();
    });

    after(async () => {
      if (this.app && this.app.isRunning()) {
        await this.app.stop();
      }
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
