import { Environment, Environments, Transaction } from '@mockoon/commons';
import { MockoonServer, listenServerEvents } from '@mockoon/commons-server';
import { dirname } from 'path';
import { mainLogger } from 'src/main/libs/logs';
import { getMainWindow } from 'src/main/libs/main-window';
import { getSettings } from 'src/main/libs/settings';

export class ServerInstance {
  private static instances: { [key in string]: ServerInstance } = {};
  private mockoonServer: MockoonServer | null = null;

  constructor(
    private environment: Environment,
    private environmentPath: string
  ) {
    this.environment = environment;
    ServerInstance.instances[this.environment.uuid] = this;
    this.start();
  }

  public static updateEnvironments = (environments: Environments) => {
    environments.forEach((environment) => {
      if (ServerInstance.instances[environment.uuid]) {
        ServerInstance.instances[environment.uuid].environment = environment;
      }
    });
  };

  public static stop(environmentUUID: string) {
    ServerInstance.instances[environmentUUID]?.mockoonServer?.stop();
  }

  public static stopAll() {
    Object.keys(ServerInstance.instances).forEach((runningEnvironmentUUID) => {
      this.stop(runningEnvironmentUUID);
    });
  }

  private start() {
    const mainWindow = getMainWindow();
    const environmentDirectory = dirname(this.environmentPath);
    const server = new MockoonServer(this.environment, {
      environmentDirectory,
      disabledRoutes:
        getSettings().disabledRoutes?.[this.environment.uuid] || [],
      refreshEnvironmentFunction: () => this.environment,
      fakerOptions: {
        seed: getSettings().fakerSeed,
        locale: getSettings().fakerLocale
      },
      envVarsPrefix: getSettings().envVarsPrefix,
      maxTransactionLogs: getSettings().maxLogsPerEnvironment
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
