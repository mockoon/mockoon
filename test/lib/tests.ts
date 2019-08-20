import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { copyFile } from 'fs';
import { Application } from 'spectron';
import { Helpers } from './helpers';
const electronPath: any = require('electron');
const mkdirp = require('mkdirp');

export class Tests {
  public spectron: Application;
  public helpers: Helpers;

  constructor(private dataFileName: string) {
    this.helpers = new Helpers(this);
    chai.should();
    chai.use(chaiAsPromised);
  }

  /**
   * Before and after hooks to run prior to the tests
   */
  public runHooks(waitUntilReady = true) {
    // copy data files before starting tests
    before(() => {
      return new Promise((resolve) => {
        mkdirp.sync('./tmp/storage/');

        copyFile('./test/data/' + this.dataFileName + '/environments.json', './tmp/storage/environments.json', () => {
          copyFile('./test/data/' + this.dataFileName + '/settings.json', './tmp/storage/settings.json', () => {
            resolve();
          });
        });
      });
    });

    before(() => {
      this.spectron = new Application({
        path: electronPath,
        args: ['./dist', '--tests'],
        webdriverOptions: {
          deprecationWarnings: false
        }
      });

      return this.spectron.start();
    });

    after(() => {
      if (this.spectron && this.spectron.isRunning()) {
        return this.spectron.stop();
      }
      return undefined;
    });

    if (waitUntilReady) {
      this.waitForWindowReady();
      this.waitForEnvironmentLoaded();
    }
  }

  /**
   * Wait for window to be ready and environments loaded
   */
  public waitForWindowReady() {
    it('Window ready', async () => {
      await this.spectron.client.waitUntilWindowLoaded();
    });
  }

  /**
   * Wait for environement to be loaded by checking for active environment menu item
   */
  public waitForEnvironmentLoaded() {
    it('Environment loaded', async () => {
      await this.spectron.client.waitForExist('.nav-item .nav-link.active', 5000);
    });
  }
}
