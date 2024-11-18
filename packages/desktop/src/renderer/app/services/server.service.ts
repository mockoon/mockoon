import { Injectable, NgZone } from '@angular/core';
import { Environment } from '@mockoon/commons';
import { from } from 'rxjs';
import { Logger } from 'src/renderer/app/classes/logger';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { MessageParams } from 'src/renderer/app/models/messages.model';
import { EventsService } from 'src/renderer/app/services/events.service';
import { TelemetryService } from 'src/renderer/app/services/telemetry.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import {
  updateEnvironmentStatusAction,
  updateProcessedDatabucketsAction
} from 'src/renderer/app/stores/actions';
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
   * @param environmentUuid
   */
  public stop(environmentUuid: string) {
    MainAPI.invoke('APP_STOP_SERVER', environmentUuid);
  }

  /**
   * Get the processed value of a databucket from the server
   *
   * @param environmentUuid
   * @param databucketUuid
   */
  public getProcessedDatabucketValue(
    environmentUuid: string,
    databucketUuid: string
  ) {
    return from(
      MainAPI.invoke(
        'APP_SERVER_GET_PROCESSED_DATABUCKET_VALUE',
        environmentUuid,
        databucketUuid
      )
    );
  }

  /**
   * Listen to server events coming from main process
   */
  private addEventListener() {
    MainAPI.receive('APP_SERVER_EVENT', (environmentUuid, eventName, data) => {
      const environment = this.store.getEnvironmentByUUID(environmentUuid);

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

            this.store.update(
              updateProcessedDatabucketsAction(environmentUuid, null)
            );
          });
          break;

        case 'entering-request':
          this.telemetryService.sendEvent();
          break;

        case 'ws-new-connection':
          if (data.inflightRequest) {
            this.zone.run(() => {
              this.eventsService.serverTransaction$.next({
                environmentUUID: environmentUuid,
                inflightRequest: data.inflightRequest
              });
            });
          }
          break;

        case 'transaction-complete':
          if (data.transaction) {
            this.zone.run(() => {
              this.eventsService.serverTransaction$.next({
                environmentUUID: environmentUuid,
                transaction: data.transaction
              });
            });
          }
          break;

        case 'data-bucket-processed':
          if (data.dataBuckets) {
            this.zone.run(() => {
              this.store.update(
                updateProcessedDatabucketsAction(
                  environmentUuid,
                  data.dataBuckets
                )
              );
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
