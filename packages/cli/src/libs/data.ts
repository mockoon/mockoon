import {
  Environment,
  EnvironmentSchema,
  HighestMigrationId,
  IsLegacyExportData,
  Migrations,
  repairRefs,
  UnwrapLegacyExport
} from '@mockoon/commons';
import { OpenAPIConverter } from '@mockoon/commons-server';
import { confirm } from '@oclif/core/lib/cli-ux';
import axios from 'axios';
import { promises as fs } from 'fs';
import { CLIMessages } from '../constants/cli-messages.constants';

/**
 * Load and parse one or more JSON data file(s).
 * Supports both legacy export files (with one or multiple envs) or new environment files.
 * If a legacy export is encountered, unwrap it.
 *
 * @param filePaths
 */
export const parseDataFiles = async (
  filePaths: string[]
): Promise<{ originalPath: string; environment: Environment }[]> => {
  const openAPIConverter = new OpenAPIConverter();
  let environments: { originalPath: string; environment: Environment }[] = [];
  let filePathIndex = 0;

  for (const filePath of filePaths) {
    try {
      const environment = await openAPIConverter.convertFromOpenAPI(filePath);

      if (environment) {
        environments.push({ environment, originalPath: filePath });
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
          environments = [
            ...environments,
            ...unwrappedExport.map((environment) => ({
              environment,
              originalPath: filePath
            }))
          ];
        } else if (typeof data === 'object') {
          environments.push({ environment: data, originalPath: filePath });
        }
      } catch (JSONError: any) {
        throw new Error(`${CLIMessages.DATA_INVALID}: ${JSONError.message}`);
      }
    }

    filePathIndex++;
  }

  if (environments.length === 0) {
    throw new Error(CLIMessages.ENVIRONMENT_NOT_AVAILABLE_ERROR);
  }

  return environments;
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
    const promptResponse: boolean = await confirm(
      `${
        environment.name ? '"' + environment.name + '"' : 'This environment'
      } does not seem to be a valid Mockoon environment or is too old. Let Mockoon attempt to repair it? (y/n)`
    );

    if (!promptResponse) {
      throw new Error(CLIMessages.DATA_TOO_OLD_ERROR);
    }
  }

  // environment data migrated with a more recent version (if installed CLI version does not include @mockoon/commons with required migrations)
  if (environment.lastMigration > HighestMigrationId) {
    throw new Error(CLIMessages.DATA_TOO_RECENT_ERROR);
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

  let validatedEnvironment = EnvironmentSchema.validate(environment).value;

  if (!validatedEnvironment) {
    throw new Error(CLIMessages.DATA_INVALID);
  }

  validatedEnvironment = repairRefs(validatedEnvironment);

  return validatedEnvironment;
};

/**
 * Migrate the environment and override user defined options
 *
 * @param environments - path to the data file or export data
 * @param options
 */
export const prepareEnvironment = async (params: {
  environment: Environment;
  userOptions: {
    port?: number;
    hostname?: string;
  };
  repair?: boolean;
}): Promise<Environment> => {
  params.environment = await migrateAndValidateEnvironment(
    params.environment,
    params.repair
  );

  if (params.userOptions.port !== undefined) {
    params.environment.port = params.userOptions.port;
  }

  if (params.userOptions.hostname !== undefined) {
    params.environment.hostname = params.userOptions.hostname;
  }

  return params.environment;
};
