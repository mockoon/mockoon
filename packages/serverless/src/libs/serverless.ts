import { Environment, FakerAvailableLocales } from '@mockoon/commons';
import {
  MockoonServer,
  createLoggerInstance,
  listenServerEvents
} from '@mockoon/commons-server';
import { RequestListener } from 'http';
import ServerlessHttp from 'serverless-http';

export class MockoonServerless {
  constructor(
    private environment: Environment,
    private options: {
      logTransaction?: boolean;
      /**
       * List of routes uuids to disable.
       * Can also accept strings containing a route partial path, e.g. 'users' will disable all routes containing 'users' in their path.
       */
      disabledRoutes?: string[];
      /**
       * Faker options: seed and locale
       */
      fakerOptions?: {
        // Faker locale (e.g. 'en', 'en_GB', etc. For supported locales, see documentation.)
        locale?: FakerAvailableLocales;
        // Number for the Faker.js seed (e.g. 1234)
        seed?: number;
      };
    } = {
      logTransaction: false,
      disabledRoutes: [],
      fakerOptions: {}
    }
  ) {
    if (!environment) {
      throw new Error('No environment data provided');
    }
  }

  /**
   * Returns an Express request listener that can be used in serverless environments
   * and with the serverless-http library.
   *
   * @returns
   */
  public requestListener(): RequestListener {
    const logger = createLoggerInstance();
    const server = new MockoonServer(this.environment, {
      disabledRoutes: this.options.disabledRoutes,
      fakerOptions: this.options.fakerOptions
    });
    listenServerEvents(
      server,
      this.environment,
      logger,
      this.options.logTransaction
    );

    return server.createRequestListener();
  }

  /**
   * Returns a serverless-http wrapped request listener for AWS Lambda.
   *
   * @returns
   */
  public awsHandler(): ServerlessHttp.Handler {
    return ServerlessHttp(this.requestListener());
  }

  /**
   * Returns a request listener for Google Cloud Functions.
   *
   * @returns
   */
  public firebaseApp(): RequestListener {
    return this.requestListener();
  }

  /**
   * Returns a serverless-http wrapped request listener for Netlify.
   *
   * @returns
   */
  public netlifyHandler(): RequestListener {
    return ServerlessHttp(this.requestListener());
  }
}
