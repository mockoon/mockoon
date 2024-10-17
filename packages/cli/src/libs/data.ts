import confirm from '@inquirer/confirm';
import {
  Environment,
  EnvironmentSchema,
  HighestMigrationId,
  Migrations,
  repairRefs
} from '@mockoon/commons';
import { OpenAPIConverter } from '@mockoon/commons-server';
import { promises as fs } from 'fs';
import { CLIMessages } from '../constants/cli-messages.constants';

/**
 * Check if an environment can be run by the CLI and
 * migrate it if needed.
 * Validate the environment schema (will automatically repair)
 *
 * @param environment
 */
const migrateAndValidateEnvironment = async (
  environment: Environment,
  forceRepair: boolean
) => {
  // environment data are too old: lastMigration is not present
  if (environment.lastMigration === undefined && !forceRepair) {
    const promptResponse: boolean = await confirm({
      message: `${
        environment.name ? '"' + environment.name + '"' : 'This environment'
      } does not seem to be a valid Mockoon environment or is too old. Let Mockoon attempt to repair it? (y/n)`
    });

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
  } catch (_error) {
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
 * Load and parse one or more JSON data file(s).
 *
 * @param filePaths
 */
export const parseDataFiles = async (
  filePaths: string[],
  userOptions: {
    ports: number[];
    hostnames: string[];
  } = { ports: [], hostnames: [] },
  repair = false
): Promise<{ originalPath: string; environment: Environment }[]> => {
  const openAPIConverter = new OpenAPIConverter();
  const environments: { originalPath: string; environment: Environment }[] = [];
  let filePathIndex = 0;
  let errorMessage = `${CLIMessages.DATA_INVALID}:`;

  for (const [index, filePath] of filePaths.entries()) {
    let environment: Environment | null = null;

    try {
      environment = await openAPIConverter.convertFromOpenAPI(filePath);
    } catch (openAPIError: any) {
      errorMessage += `\nOpenAPI parser: ${openAPIError.message}`;

      // immediately throw if the file is not a JSON file
      if (filePath.includes('.yml') || filePath.includes('.yaml')) {
        throw new Error(errorMessage);
      }

      try {
        let data: any;

        if (filePath.startsWith('http')) {
          data = await (await fetch(filePath)).text();
        } else {
          data = await fs.readFile(filePath, { encoding: 'utf-8' });
        }

        if (typeof data === 'string') {
          data = JSON.parse(data);
        }

        if (typeof data === 'object') {
          environment = await migrateAndValidateEnvironment(data, repair);
        }
      } catch (JSONError: any) {
        errorMessage += `\nMockoon parser: ${JSONError.message}`;
        throw new Error(errorMessage);
      }
    }

    if (environment) {
      if (userOptions.ports[index] !== undefined) {
        environment.port = userOptions.ports[index];
      }

      if (userOptions.hostnames[index] !== undefined) {
        environment.hostname = userOptions.hostnames[index];
      }

      environments.push({ environment, originalPath: filePath });
    }

    filePathIndex++;
  }

  if (environments.length === 0) {
    throw new Error(CLIMessages.ENVIRONMENT_NOT_AVAILABLE_ERROR);
  }

  return environments;
};
