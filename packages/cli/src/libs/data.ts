import {
  Environment,
  Environments,
  EnvironmentSchema,
  HighestMigrationId,
  IsLegacyExportData,
  Migrations,
  UnwrapLegacyExport
} from '@mockoon/commons';
import { OpenAPIConverter } from '@mockoon/commons-server';
import axios from 'axios';
import { promises as fs } from 'fs';
import { prompt } from 'inquirer';
import * as mkdirp from 'mkdirp';
import { join } from 'path';
import { ProcessDescription } from 'pm2';
import { Config } from '../config';
import { Messages } from '../constants/messages.constants';
import { transformEnvironmentName } from './utils';

/**
 * Load and parse a JSON data file.
 * Supports both legacy export files (with one or multiple envs) or new environment files.
 * If a legacy export is encountered, unwrap it and update `--data` flag to reflect the number of environments unwrapped
 *
 * @param filePath
 */
export const parseDataFiles = async (
  filePaths: string[]
): Promise<{ filePaths: string[]; environments: Environments }> => {
  const openAPIConverter = new OpenAPIConverter();
  let environments: Environments = [];
  let newFilePaths: string[] = [];

  let filePathIndex = 0;

  for (const filePath of filePaths) {
    try {
      const environment = await openAPIConverter.convertFromOpenAPI(filePath);

      if (environment) {
        environments.push(environment);
        newFilePaths.push(filePath);
      }
    } catch (openAPIError: any) {
      try {
        let data: any;

        if (filePath.startsWith('http')) {
          data = (await axios.get(filePath, { timeout: 30000 })).data;
        } else {
          data = await fs.readFile(filePath, { encoding: 'utf-8' });
        }

        if (typeof data === 'string') {
          data = JSON.parse(data);
        }

        if (IsLegacyExportData(data)) {
          const unwrappedExport = UnwrapLegacyExport(data);

          // Extract all environments, eventually filter items of type 'route'
          environments = [...environments, ...unwrappedExport];

          // if we unwrapped more than one exported environment, add as many `--data` flag entries
          if (unwrappedExport.length >= 1) {
            newFilePaths = [
              ...newFilePaths,
              ...new Array(unwrappedExport.length).fill(filePath)
            ];
          }
        } else if (typeof data === 'object') {
          environments.push(data);
          newFilePaths.push(filePath);
        }
      } catch (JSONError: any) {
        throw new Error(`${Messages.CLI.DATA_INVALID}: ${JSONError.message}`);
      }
    }

    filePathIndex++;
  }

  if (environments.length === 0) {
    throw new Error(Messages.CLI.ENVIRONMENT_NOT_AVAILABLE_ERROR);
  }

  return { filePaths: newFilePaths, environments };
};

/**
 * Check if an environment can be run by the CLI and
 * migrate it if needed.
 * Validate the environment schema (will automatically repair)
 *
 * @param environment
 */
const migrateAndValidateEnvironment = async (
  environment: Environment,
  forceRepair?: boolean
) => {
  // environment data are too old: lastMigration is not present
  if (environment.lastMigration === undefined && !forceRepair) {
    const promptResponse: { repair: string } = await prompt([
      {
        name: 'repair',
        message: `${
          environment.name ? '"' + environment.name + '"' : 'This environment'
        } does not seem to be a valid Mockoon environment or is too old. Let Mockoon attempt to repair it?`,
        type: 'confirm',
        default: true
      }
    ]);

    if (!promptResponse.repair) {
      throw new Error(Messages.CLI.DATA_TOO_OLD_ERROR);
    }
  }

  // environment data migrated with a more recent version (if installed CLI version does not include @mockoon/commons with required migrations)
  if (environment.lastMigration > HighestMigrationId) {
    throw new Error(Messages.CLI.DATA_TOO_RECENT_ERROR);
  }

  try {
    // apply migrations
    Migrations.forEach((migration) => {
      if (migration.id > environment.lastMigration) {
        migration.migrationFunction(environment);
      }
    });
  } catch (error) {
    environment.lastMigration = HighestMigrationId;
  }

  const validatedEnvironment = EnvironmentSchema.validate(environment).value;

  return validatedEnvironment;
};

/**
 * Migrate the environment
 * Copy the environment to a new temporary file.
 *
 * @param environments - path to the data file or export data
 * @param options
 */
export const prepareEnvironment = async (params: {
  environment: Environment;
  userOptions: {
    port?: number;
    pname?: string;
    hostname?: string;
  };
  dockerfileDir?: string;
  repair?: boolean;
}): Promise<{
  name: string;
  protocol: string;
  hostname: string;
  endpointPrefix: string;
  port: number;
  dataFile: string;
}> => {
  params.environment = await migrateAndValidateEnvironment(
    params.environment,
    params.repair
  );

  // transform the provided name or env's name to be used as process name
  params.environment.name = transformEnvironmentName(
    params.userOptions.pname || params.environment.name
  );

  if (params.userOptions.port !== undefined) {
    params.environment.port = params.userOptions.port;
  }

  if (params.userOptions.hostname !== undefined) {
    params.environment.hostname = params.userOptions.hostname;
  }

  let dataFile: string = join(
    Config.dataPath,
    `${params.environment.name}.json`
  );

  // if we are building a Dockerfile, we want the data in the same folder
  if (params.dockerfileDir) {
    await mkdirp(params.dockerfileDir);
    dataFile = `${params.dockerfileDir}/${params.environment.name}.json`;
  }

  // save environment to data path
  await fs.writeFile(dataFile, JSON.stringify(params.environment));

  return {
    name: params.environment.name,
    protocol: params.environment.tlsOptions.enabled ? 'https' : 'http',
    hostname: params.environment.hostname,
    port: params.environment.port,
    endpointPrefix: params.environment.endpointPrefix,
    dataFile
  };
};

/**
 * Clean the temporary data files by deleting the ones with no
 * matching running process
 *
 * @param processes
 */
export const cleanDataFiles = async (
  processes: ProcessDescription[]
): Promise<void> => {
  const files = await fs.readdir(Config.dataPath);

  files.forEach(async (file) => {
    if (
      processes.findIndex((process) => `${process.name}.json` === file) === -1
    ) {
      await fs.unlink(join(Config.dataPath, file));
    }
  });
};
