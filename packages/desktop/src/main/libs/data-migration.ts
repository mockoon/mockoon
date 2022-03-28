import { Environments } from '@mockoon/commons';
import {
  get as storageGet,
  getDataPath,
  set as storageSet
} from 'electron-json-storage';
import { info as logInfo } from 'electron-log';
import { sep as pathSeparator } from 'path';
import { EnvironmentDescriptor } from 'src/shared/models/settings.model';
import { promisify } from 'util';

export const migrateData = async () => {
  logInfo('[MAIN][MIGRATION]Migrating data to new storage system');

  const environmentsList: EnvironmentDescriptor[] = [];

  const environments: Environments = (await promisify(storageGet)(
    'environments'
  )) as Environments;

  for (
    let environmentIndex = 0;
    environmentIndex < environments.length;
    environmentIndex++
  ) {
    const environment = environments[environmentIndex];
    const environmentName = `environment-${environmentIndex}`;

    environmentsList.push({
      uuid: environment.uuid,
      path: `${getDataPath()}${pathSeparator}${environmentName}.json`
    });
    await promisify(storageSet)(environmentName, environment);
  }

  logInfo('[MAIN][MIGRATION]Migration to new storage system done');

  return environmentsList;
};
