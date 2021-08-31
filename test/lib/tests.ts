import { Environment } from '@mockoon/commons';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import chaiExclude from 'chai-exclude';
import * as chaiUUID from 'chai-uuid';
import { IpcRenderer } from 'electron';
import { constants, promises as fs } from 'fs';
import * as glob from 'glob';
import * as mkdirp from 'mkdirp';
import { basename, join, resolve, sep } from 'path';
import { Application } from 'spectron';
import { Settings } from 'src/shared/models/settings.model';
import { Helpers } from 'test/lib/helpers';
import { promisify } from 'util';

const electronPath: any = require('electron');

export class Tests {
  public app: Application;
  public ipcRenderer: IpcRenderer;
  public helpers: Helpers;

  constructor(
    private dataFileName: string,
    private hasSettings: boolean = true,
    private waitUntilWindowReady: boolean = true,
    private waitUntilEnvironmentLoaded: boolean = true,
    private alterSettings: any = null
  ) {
    this.helpers = new Helpers(this);

    chai.should();
    chai.use(chaiAsPromised);
    chai.use(chaiExclude);
    chai.use(chaiUUID);

    this.runHooks();
  }

  /**
   * Before and after hooks to run prior to the tests
   */
  private runHooks() {
    // copy data files before starting tests
    before(async () => {
      await this.prepareStorageFolder();
      await this.copyEnvironments();
      await this.copySettings(this.alterSettings);

      this.app = new Application({
        path: electronPath,
        waitTimeout: 1000,
        args: ['-r', join(__dirname, './electron-mocks.js'), '.'],
        webdriverOptions: {
          deprecationWarnings: false
        },
        chromeDriverArgs: [`user-data-dir=${resolve('./tmp')}`]
      });
      await this.app.start();
      // there is a typing error in Spectron?
      this.ipcRenderer = (this.app.electron as any).ipcRenderer;
    });

    after(async () => {
      // wait for save before closing
      await promisify(setTimeout)(2500);

      if (this.app && this.app.isRunning()) {
        await this.app.stop();
      }
    });

    if (this.waitUntilWindowReady) {
      this.waitForWindowReady();
    }

    if (this.waitUntilEnvironmentLoaded) {
      this.waitForEnvironmentLoaded();
    }
  }

  /**
   * Wait for window to be ready and environments loaded
   */
  private waitForWindowReady() {
    it('Should wait for window to be ready', async () => {
      await this.app.client.waitUntilWindowLoaded(10000);
    });
  }

  /**
   * Wait for environment to be loaded by checking for active environment menu item
   */
  private waitForEnvironmentLoaded() {
    it('Should load the environment', async () => {
      await this.helpers.assertHasActiveEnvironment();
    });
  }

  /**
   * Empty the storage folder and (re)create it if needed
   */
  private async prepareStorageFolder() {
    try {
      const storagePath = './tmp/storage/';

      await fs.rmdir(storagePath, {
        recursive: true
      });

      await mkdirp(storagePath);
    } catch (err) {}
  }

  /**
   * Copy environments.json file if exists
   */
  private async copyEnvironments() {
    // list all environment file including from old storage (for migration tests)
    const environmentFiles = await promisify(glob)(
      `./test/data/${this.dataFileName}/environment*.json`
    );

    try {
      if (environmentFiles) {
        for (const filePath of environmentFiles) {
          const filename = basename(filePath);
          await fs.copyFile(filePath, `./tmp/storage/${filename}`);
        }
      }
    } catch (error) {}
  }

  /**
   * Copy settings.json file if exists
   */
  private async copySettings(alterSettings: any) {
    const settingsDestFilePath = './tmp/storage/settings.json';
    let settingsFilePath = `./test/data/${this.dataFileName}/settings.json`;
    let settingsFileExists = true;

    try {
      await fs.access(settingsFilePath, constants.F_OK);
    } catch (error) {
      settingsFileExists = false;
    }

    // if no custom file provided for the test, revert to the generic one
    if (!settingsFileExists) {
      settingsFilePath = './test/data/settings.json';
    }

    try {
      if (this.hasSettings) {
        await fs.copyFile(settingsFilePath, settingsDestFilePath);

        const settingsFile = await fs.readFile(settingsDestFilePath, 'utf-8');
        let settings: Settings = JSON.parse(settingsFile);

        if (alterSettings) {
          settings = { ...settings, ...alterSettings };
        }

        // list environment files (from new storage only)
        const environmentFiles = await promisify(glob)(
          './tmp/storage/environment-*.json',
          { absolute: true }
        );

        for (const filePath of environmentFiles) {
          const environment: Environment = JSON.parse(
            (await fs.readFile(filePath)).toString()
          );

          settings.environments.push({
            path: filePath.replace('/', sep),
            uuid: environment.uuid
          });
        }

        await fs.writeFile(settingsDestFilePath, JSON.stringify(settings));
      }
    } catch (err) {}
  }
}
