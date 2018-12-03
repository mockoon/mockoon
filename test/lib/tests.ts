import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { copyFile, existsSync, mkdirSync } from 'fs';
import { Application } from 'spectron';
const electronPath: any = require('electron');

export class Tests {
  // folder name for test data
  private dataFileName: string;
  public spectron: Application;

  constructor(dataFileName) {
    this.dataFileName = dataFileName;

    chai.should();
    chai.use(chaiAsPromised);
  }

  /**
   * Before and after hooks to run prior to the tests
   */
  public runHooks() {
    // copy data files before starting tests
    before(() => {
      return new Promise((resolve) => {
        if (!existsSync('./tmp/') || !existsSync('./tmp/storage/')) {
          mkdirSync('./tmp/');
          mkdirSync('./tmp/storage/');
        }

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
        args: ['./dist', '--tests']
      });

      return this.spectron.start();
    });

    after(() => {
      if (this.spectron && this.spectron.isRunning()) {
        return this.spectron.stop();
      }
      return undefined;
    });
  }
}
