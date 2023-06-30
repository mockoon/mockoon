import { Environment } from '@mockoon/commons';
import {
  createLoggerInstance,
  listenServerEvents,
  MockoonServer
} from '@mockoon/commons-server';
import { RequestListener } from 'http';
import ServerlessHttp from 'serverless-http';

export class MockoonServerless {
  constructor(
    private environment: Environment,
    private options: { logTransaction: boolean } = { logTransaction: false }
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
    const server = new MockoonServer(this.environment);
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
