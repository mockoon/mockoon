import { Injectable } from '@angular/core';
import { Environment, MockoonResponse, MockoonServer } from '@mockoon/commons';
import { Logger } from 'src/app/classes/logger';
import { AnalyticsEvents } from 'src/app/enums/analytics-events.enum';
import { MessageParams } from 'src/app/models/messages.model';
import { DataService } from 'src/app/services/data.service';
import { EventsService } from 'src/app/services/events.service';
import { ToastsService } from 'src/app/services/toasts.service';
import {
  logRequestAction,
  updateEnvironmentStatusAction
} from 'src/app/stores/actions';
import { Store } from 'src/app/stores/store';

@Injectable({ providedIn: 'root' })
export class ServerService extends Logger {
  private runningInstances: { [key: string]: MockoonServer } = {};

  constructor(
    protected toastService: ToastsService,
    private dataService: DataService,
    private store: Store,
    private eventsService: EventsService
  ) {
    super('[SERVICE][SERVER]', toastService);
  }

  /**
   * Start an environment/server
   *
   * @param environment
   */
  public start(environment: Environment) {
    const server = new MockoonServer(environment, {
      refreshEnvironmentFunction: (environmentUUID) =>
        this.store.getEnvironmentByUUID(environmentUUID),
      duplicatedRouteUUIDs: this.store.get('duplicatedRoutes')[environment.uuid]
    });

    this.addListeners(server, environment);

    server.start();
  }

  /**
   * Completely stop an environment/server
   *
   * @param environmentUUID
   */
  public stop(environmentUUID: string) {
    if (this.runningInstances[environmentUUID]) {
      this.runningInstances[environmentUUID].stop();
    }
  }

  /**
   * Add events listeners on the server instance
   *
   * @param server
   * @param environment
   */
  private addListeners(server: MockoonServer, environment: Environment) {
    const loggerMessageParams: MessageParams = {
      port: environment.port,
      uuid: environment.uuid,
      proxyHost: environment.proxyHost
    };

    server.once('creating-proxy', () => {
      this.logMessage('info', 'CREATING_PROXY', loggerMessageParams);
    });

    server.once('started', () => {
      this.logMessage('info', 'ENVIRONMENT_STARTED', loggerMessageParams);

      this.runningInstances[environment.uuid] = server;

      this.store.update(
        updateEnvironmentStatusAction(
          { running: true, needRestart: false },
          environment.uuid
        )
      );
    });

    server.once('stopped', () => {
      this.logMessage('info', 'ENVIRONMENT_STOPPED', loggerMessageParams);

      this.store.update(
        updateEnvironmentStatusAction(
          {
            running: false,
            needRestart: false
          },
          environment.uuid
        )
      );

      delete this.runningInstances[environment.uuid];
    });

    server.on('error', (errorCode, originalError) => {
      this.logMessage('error', errorCode, {
        error: originalError,
        ...loggerMessageParams
      });
    });

    server.on('entering-request', () => {
      this.eventsService.analyticsEvents.next(
        AnalyticsEvents.SERVER_ENTERING_REQUEST
      );
    });

    server.on('response-close', (response: MockoonResponse) => {
      this.store.update(
        logRequestAction(environment.uuid, this.dataService.formatLog(response))
      );
    });
  }
}
