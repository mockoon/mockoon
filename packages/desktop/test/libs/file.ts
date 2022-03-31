import { Environment, Environments } from '@mockoon/commons';
import { promises as fs } from 'fs';
import { get as objectGetPath } from 'object-path';
import { Settings } from '../../src/shared/models/settings.model';
import utils from '../libs/utils';

class File {
  private settingsPath = './tmp/storage/settings.json';

  public async editEnvironment(
    filePath: string,
    properties: Partial<Environment>
  ) {
    let environment = JSON.parse((await fs.readFile(filePath)).toString());
    environment = { ...environment, ...properties };
    await fs.writeFile(filePath, JSON.stringify(environment));
  }

  public async editSettingsAndReload(properties: Partial<Settings>) {
    // wait for eventual settings save before modyfing the settings
    await utils.waitForAutosave();
    let settings = JSON.parse(
      (await fs.readFile(this.settingsPath)).toString()
    );
    settings = { ...settings, ...properties };
    await fs.writeFile(this.settingsPath, JSON.stringify(settings));
    await browser.reloadSession();
    await browser.pause(2000);
  }

  public async verifyObjectPropertyInFile(
    filePath: string,
    objectPaths: string | string[],
    values: any | any[],
    exists = false
  ) {
    const environmentFile = await fs.readFile(filePath);
    const environments: Environments = JSON.parse(environmentFile.toString());

    this.verifyObjectProperty(environments, objectPaths, values, exists);
  }

  public verifyObjectProperty(
    object: any,
    objectPaths: string | string[],
    values: any | any[],
    exists = false
  ) {
    objectPaths = Array.isArray(objectPaths) ? objectPaths : [objectPaths];
    values = Array.isArray(values) ? values : [values];

    for (let index = 0; index < objectPaths.length; index++) {
      if (exists) {
        expect(objectGetPath(object, objectPaths[index])).toExist();
      } else {
        expect(objectGetPath(object, objectPaths[index])).toEqual(
          values[index]
        );
      }
    }
  }
}

export default new File();
