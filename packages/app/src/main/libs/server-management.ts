import {
  Environment,
  Environments,
  InFlightRequest,
  ProcessedDatabucketWithoutValue,
  Transaction
} from '@mockoon/commons';
import { MockoonServer, listenServerEvents } from '@mockoon/commons-server';
import { dirname } from 'path';
import { mainLogger } from 'src/main/libs/logs';
import { getMainWindow } from 'src/main/libs/main-window';
import { getSettings } from 'src/main/libs/settings';

export class ServerInstance {
  private static instances: Record<string, ServerInstance> = {};
  private mockoonServer: MockoonServer | null = null;

  constructor(
    private environment: Environment,
    private environmentPath: string
  ) {
    ServerInstance.instances[this.environment.uuid] = this;
    this.start();
  }

  public static updateEnvironments = (environments: Environments) => {
    environments.forEach((environment) => {
      if (ServerInstance.instances[environment.uuid]?.mockoonServer) {
        ServerInstance.instances[
          environment.uuid
        ].mockoonServer.updateEnvironment(environment);
      }
    });
  };

  public static stop(environmentUuid: string) {
    ServerInstance.instances[environmentUuid]?.mockoonServer?.stop();
  }

  public static stopAll() {
    Object.keys(ServerInstance.instances).forEach((runningEnvironmentUuid) => {
      this.stop(runningEnvironmentUuid);
    });
  }

  public static getProcessedDatabucketValue(
    environmentUuid: string,
    databucketUuid: string
  ) {
    return ServerInstance.instances[
      environmentUuid
    ]?.mockoonServer?.getProcessedDatabucket(databucketUuid)?.value;
  }

  private start() {
    const mainWindow = getMainWindow();
    const environmentDirectory = dirname(this.environmentPath);
    const server = new MockoonServer(this.environment, {
      environmentDirectory,
      disabledRoutes:
        getSettings().disabledRoutes?.[this.environment.uuid] || [],
      fakerOptions: {
        seed: getSettings().fakerSeed,
        locale: getSettings().fakerLocale
      },
      envVarsPrefix: getSettings().envVarsPrefix,
      maxTransactionLogs: getSettings().maxLogsPerEnvironment,
      enableRandomLatency: getSettings().enableRandomLatency
    });

    listenServerEvents(
      server,
      this.environment,
      mainLogger(),
      getSettings().logTransactions
    );

    server.once('started', () => {
      this.mockoonServer = server;
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          'APP_SERVER_EVENT',
          this.environment.uuid,
          'started'
        );
      }
    });

    server.once('stopped', () => {
      delete ServerInstance.instances[this.environment.uuid];

      // verify that window is still present as we stop servers when app quits too
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          'APP_SERVER_EVENT',
          this.environment.uuid,
          'stopped'
        );

        return;
      }
    });

    server.on('entering-request', () => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          'APP_SERVER_EVENT',
          this.environment.uuid,
          'entering-request'
        );
      }
    });

    server.on('ws-new-connection', (request: InFlightRequest) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          'APP_SERVER_EVENT',
          this.environment.uuid,
          'ws-new-connection',
          { inflightRequest: request }
        );
      }
    });

    server.on('transaction-complete', (transaction: Transaction) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          'APP_SERVER_EVENT',
          this.environment.uuid,
          'transaction-complete',
          { transaction }
        );
      }
    });

    server.on(
      'data-bucket-processed',
      (dataBuckets: ProcessedDatabucketWithoutValue[]) => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send(
            'APP_SERVER_EVENT',
            this.environment.uuid,
            'data-bucket-processed',
            { dataBuckets }
          );
        }
      }
    );

    server.on('error', (errorCode: any, originalError: any) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          'APP_SERVER_EVENT',
          this.environment.uuid,
          'error',
          {
            errorCode,
            originalError
          }
        );
      }
    });

    server.start();
  }
}
