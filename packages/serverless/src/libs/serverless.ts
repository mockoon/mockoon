import {
  Environment,
  ServerOptions,
  defaultEnvironmentVariablesPrefix,
  defaultMaxTransactionLogs
} from '@mockoon/commons';
import {
  MockoonServer,
  createLoggerInstance,
  listenServerEvents
} from '@mockoon/commons-server';
import { RequestListener } from 'http';
import ServerlessHttp from 'serverless-http';

export class MockoonServerless {
  private options: ServerOptions & { logTransaction: boolean } = {
    logTransaction: false,
    disabledRoutes: [],
    fakerOptions: {},
    envVarsPrefix: defaultEnvironmentVariablesPrefix,
    enableAdminApi: true,
    disableTls: false,
    maxTransactionLogs: defaultMaxTransactionLogs,
    enableRandomLatency: false
  };

  constructor(
    private environment: Environment,
    options: Partial<ServerOptions>
  ) {
    if (!environment) {
      throw new Error('No environment data provided');
    }

    this.options = {
      ...this.options,
      ...options
    };
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
      fakerOptions: this.options.fakerOptions,
      envVarsPrefix: this.options.envVarsPrefix,
      enableAdminApi: this.options.enableAdminApi,
      disableTls: this.options.disableTls,
      maxTransactionLogs: this.options.maxTransactionLogs,
      enableRandomLatency: this.options.enableRandomLatency
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
