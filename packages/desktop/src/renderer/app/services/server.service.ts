import { Injectable, NgZone } from '@angular/core';
import { Environment } from '@mockoon/commons';
import { Logger } from 'src/renderer/app/classes/logger';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { MessageParams } from 'src/renderer/app/models/messages.model';
import { EventsService } from 'src/renderer/app/services/events.service';
import { TelemetryService } from 'src/renderer/app/services/telemetry.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { updateEnvironmentStatusAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Injectable({ providedIn: 'root' })
export class ServerService extends Logger {
  constructor(
    protected toastService: ToastsService,
    private store: Store,
    private zone: NgZone,
    private telemetryService: TelemetryService,
    private eventsService: EventsService
  ) {
    super('[RENDERER][SERVICE][SERVER] ', toastService);

    this.addEventListener();
  }

  /**
   * Start an environment/server
   *
   * @param environment
   */
  public async start(environment: Environment, environmentPath: string) {
    MainAPI.invoke('APP_START_SERVER', environment, environmentPath);
  }

  /**
   * Completely stop an environment/server
   *
   * @param environmentUUID
   */
  public stop(environmentUUID: string) {
    MainAPI.invoke('APP_STOP_SERVER', environmentUUID);
  }

  /**
   * Listen to server events coming from main process
   */
  private addEventListener() {
    MainAPI.receive('APP_SERVER_EVENT', (environmentUUID, eventName, data) => {
      const environment = this.store.getEnvironmentByUUID(environmentUUID);

      if (!environment) {
        return;
      }

      const loggerMessageParams: MessageParams = {
        port: environment.port,
        uuid: environment.uuid,
        hostname: environment.hostname,
        proxyHost: environment.proxyHost
      };

      switch (eventName) {
        case 'started':
          this.zone.run(() => {
            this.store.update(
              updateEnvironmentStatusAction(
                { running: true, needRestart: false },
                environment.uuid
              )
            );
          });
          break;

        case 'stopped':
          this.zone.run(() => {
            this.store.update(
              updateEnvironmentStatusAction(
                {
                  running: false,
                  needRestart: false
                },
                environment.uuid
              )
            );
          });
          break;

        case 'entering-request':
          this.telemetryService.sendEvent();
          break;

        case 'transaction-complete':
          if (data.transaction) {
            this.zone.run(() => {
              this.eventsService.serverTransaction$.next({
                environmentUUID,
                transaction: data.transaction
              });
            });
          }
          break;

        case 'error':
          this.logMessage('error', data.errorCode, {
            error: data.originalError,
            ...loggerMessageParams
          });
          break;
        default:
          break;
      }
    });
  }
}
