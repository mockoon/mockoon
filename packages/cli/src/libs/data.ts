import {
  Environment,
  EnvironmentSchema,
  HighestMigrationId,
  Migrations,
  OpenApiConverter,
  repairRefs
} from '@mockoon/commons';
import { promises as fs } from 'fs';
import { CLIMessages } from '../constants/cli-messages.constants';
import { confirm } from './utils';

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
    const answer = await confirm(
      `${
        environment.name ? '"' + environment.name + '"' : 'This environment'
      } does not seem to be a valid Mockoon environment or is too old. Let Mockoon attempt to repair it?`
    );

    if (!answer) {
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
 * Load a file from the filesystem or a URL.
 * If parse is true, it will also parse the file content as JSON.
 *
 * @param filePath - path or URL to the file
 * @param parse - set to false to return raw file content
 * @returns
 */
export const loadFile = async <T extends boolean>(
  filePath: string,
  parse: T
): Promise<T extends true ? any : string> => {
  try {
    let data: any;

    if (filePath.startsWith('http')) {
      data = await (await fetch(filePath)).text();
    } else {
      data = await fs.readFile(filePath, { encoding: 'utf-8' });
    }

    if (parse && typeof data === 'string') {
      data = JSON.parse(data);
    }

    return data;
  } catch (error: unknown) {
    throw new Error((error as Error).message);
  }
};

/**
 * Load and parse a JSON data file.
 *
 * @param filePaths
 */
export const parseDataFile = async (
  filePath: string,
  userOptions: {
    port?: number;
    hostname?: string;
    proxy?: 'enabled' | 'disabled';
  } = { port: undefined, hostname: undefined },
  repair = false
): Promise<{ originalPath: string; environment: Environment }> => {
  const openAPIConverter = new OpenApiConverter();
  const data = await loadFile(filePath, false);
  let errorMessage = `${CLIMessages.DATA_INVALID}:`;
  let environment: Environment | null = null;

  try {
    environment = await openAPIConverter.convertFromOpenAPI(data);
  } catch (openAPIError) {
    if (openAPIError instanceof Error) {
      errorMessage += `\nOpenAPI parser: ${openAPIError.message}`;
    }

    // immediately throw if the file is not a JSON file (mockoon only supports JSON files)
    if (filePath.includes('.yml') || filePath.includes('.yaml')) {
      throw new Error(errorMessage);
    }

    try {
      if (typeof data === 'string') {
        environment = JSON.parse(data);
      }

      if (environment) {
        environment = await migrateAndValidateEnvironment(environment, repair);
      }
    } catch (JSONError) {
      if (JSONError instanceof Error) {
        errorMessage += `\nMockoon parser: ${JSONError.message}`;
      }

      throw new Error(errorMessage);
    }
  }

  if (environment) {
    if (userOptions.port !== undefined) {
      environment.port = userOptions.port;
    }

    if (userOptions.hostname !== undefined) {
      environment.hostname = userOptions.hostname;
    }

    if (userOptions.proxy) {
      environment.proxyMode = userOptions.proxy === 'enabled';
    }
  }

  if (!environment) {
    throw new Error(CLIMessages.ENVIRONMENT_NOT_AVAILABLE_ERROR);
  }

  return { originalPath: filePath, environment };
};
