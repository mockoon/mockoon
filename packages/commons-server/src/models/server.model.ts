import { Environment, FakerAvailableLocales } from '@mockoon/commons';

export type ServerOptions = {
  /**
   * Directory where to find the environment file.
   */
  environmentDirectory?: string;

  /**
   * List of routes uuids to disable.
   * Can also accept strings containing a route partial path, e.g. 'users' will disable all routes containing 'users' in their path.
   */
  disabledRoutes?: string[];

  /**
   * Method used by the library to refresh the environment information
   */
  refreshEnvironmentFunction?: (environmentUUID: string) => Environment | null;

  /**
   * Faker options: seed and locale
   */
  fakerOptions?: {
    // Faker locale (e.g. 'en', 'en_GB', etc. For supported locales, see documentation.)
    locale?: FakerAvailableLocales;
    // Number for the Faker.js seed (e.g. 1234)
    seed?: number;
  };

  /**
   * Environment variables prefix
   */
  envVarsPrefix: string;

  /**
   * Enable the admin API
   * https://mockoon.com/docs/latest/admin-api/overview/
   */
  enableAdminApi: boolean;

  /**
   * Disable TLS
   */
  disableTls: boolean;
};
