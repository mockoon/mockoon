import { Environment, Environments } from '@mockoon/commons';
import { MockoonServer } from '@mockoon/commons-server';
import { info as logInfo } from 'electron-log';
import { dirname } from 'path';
import { getMainWindow } from 'src/main/libs/main-window';

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
      logInfo(
        `[SERVICE][SERVER]Server ${runningEnvironmentUUID} has been stopped`
      );
      this.stop(runningEnvironmentUUID);
    });
  }

  private start() {
    const mainWindow = getMainWindow();
    const environmentDirectory = dirname(this.environmentPath);
    const server = new MockoonServer(this.environment, {
      environmentDirectory,
      refreshEnvironmentFunction: () => this.environment
    });

    server.once('started', () => {
      this.mockoonServer = server;

      mainWindow.webContents.send(
        'APP_SERVER_EVENT',
        this.environment.uuid,
        'started'
      );
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

    server.once('creating-proxy', () => {
      mainWindow.webContents.send(
        'APP_SERVER_EVENT',
        this.environment.uuid,
        'creating-proxy'
      );
    });

    server.on('entering-request', () => {
      mainWindow.webContents.send(
        'APP_SERVER_EVENT',
        this.environment.uuid,
        'entering-request'
      );
    });

    server.on('transaction-complete', (transaction) => {
      mainWindow.webContents.send(
        'APP_SERVER_EVENT',
        this.environment.uuid,
        'transaction-complete',
        { transaction }
      );
    });

    server.on('error', (errorCode, originalError) => {
      mainWindow.webContents.send(
        'APP_SERVER_EVENT',
        this.environment.uuid,
        'error',
        {
          errorCode,
          originalError
        }
      );
    });

    server.start();
  }
}
