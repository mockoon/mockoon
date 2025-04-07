import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { DeployInstance } from '@mockoon/cloud';
import {
  Environment,
  ProcessedDatabucket,
  ProcessedDatabucketWithoutValue,
  ServerEvents,
  Transaction
} from '@mockoon/commons';
import {
  catchError,
  delay,
  EMPTY,
  filter,
  from,
  map,
  merge,
  Subject,
  switchMap,
  tap
} from 'rxjs';
import { MessageParams } from 'src/renderer/app/models/messages.model';
import { EventsService } from 'src/renderer/app/services/events.service';
import { LoggerService } from 'src/renderer/app/services/logger-service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { TelemetryService } from 'src/renderer/app/services/telemetry.service';
import {
  updateEnvironmentStatusAction,
  updateProcessedDatabucketsAction
} from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Injectable({ providedIn: 'root' })
export class ServerService {
  private activeSseConnections = new Map<
    string,
    { subject: Subject<string>; abortController: AbortController }
  >();

  constructor(
    private store: Store,
    private zone: NgZone,
    private telemetryService: TelemetryService,
    private eventsService: EventsService,
    private mainApiService: MainApiService,
    private loggerService: LoggerService,
    private httpClient: HttpClient
  ) {}

  /**
   * Listen to SSE coming from the currently active environment admin API
   */
  public init() {
    this.mainApiService.receive(
      'APP_SERVER_EVENT',
      (environmentUuid, eventName, data) => {
        this.processEvent(environmentUuid, eventName, data);
      }
    );

    if (Config.isWeb) {
      return this.store.select('deployInstances').pipe(
        filter((instances) => !!instances),
        tap((instances) => {
          const currentInstanceIds = instances.map(
            (instance) => instance.environmentUuid
          );

          // Stop and remove SSE connections for instances that no longer exist
          this.activeSseConnections.forEach((connection, instanceId) => {
            if (!currentInstanceIds.includes(instanceId)) {
              this.removeInstanceEventsListener(instanceId);
            }
          });
        }),
        filter((instances) => instances.length > 0),
        delay(3000), // Delay to ensure all instances are up before listening
        tap((instances) => {
          // Start or renew SSE for instances
          instances.forEach((instance) => {
            const existingConnection = this.activeSseConnections.get(
              instance.environmentUuid
            );

            if (existingConnection) {
              // Close the existing connection and replace it with a new one (re-deploy)
              this.removeInstanceEventsListener(instance.environmentUuid);
            }

            this.listenInstanceEvents(instance);
          });
        }),
        switchMap(() => {
          return merge(
            Array.from(this.activeSseConnections.entries()).map(
              ([environmentUuid, activeSseConnection]) =>
                activeSseConnection.subject.pipe(
                  map((message) => ({ environmentUuid, message }))
                )
            )
          );
        }),
        tap((messages) => {
          messages.forEach(({ environmentUuid, message }) => {
            const payload: {
              event: keyof ServerEvents;
              transaction?: Transaction;
              dataBuckets?: ProcessedDatabucketWithoutValue[];
            } = JSON.parse(message as string);

            this.processEvent(environmentUuid, payload.event, payload);
          });
        }),
        catchError(() => {
          return EMPTY;
        })
      );
    } else {
      return EMPTY;
    }
  }

  /**
   * Send the new environment configuration to the instance admin API
   *
   * @param environments
   * @returns
   */
  public updateServerEnvironment(environments: Environment[]) {
    if (environments.length === 0) {
      return;
    }

    const instance = this.store
      .get('deployInstances')
      .find(
        (deployInstance) =>
          deployInstance.environmentUuid === environments[0].uuid
      );

    // we may not have the instance yet
    if (!instance) {
      return;
    }

    this.httpClient
      .put(
        `${this.buildRemoteInstanceUrl(instance)}/environment`,
        environments[0],
        {
          headers: { Authorization: `Bearer ${instance.apiKey}` }
        }
      )
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  /**
   * Start an environment/server
   *
   * @param environment
   */
  public async start(environment: Environment, environmentPath: string) {
    this.mainApiService.invoke(
      'APP_START_SERVER',
      environment,
      environmentPath
    );
  }

  /**
   * Completely stop an environment/server
   *
   * @param environmentUuid
   */
  public stop(environmentUuid: string) {
    this.mainApiService.invoke('APP_STOP_SERVER', environmentUuid);
  }

  /**
   * Get the processed value of a databucket from the local server
   * or from the remote admin API
   *
   * @param activeEnvironmentUuid
   * @param databucketUuid
   */
  public getProcessedDatabucketValue(
    activeEnvironmentUuid: string,
    databucketUuid: string
  ) {
    if (Config.isWeb) {
      const activeEnvironmentInstance = this.store
        .get('deployInstances')
        .find((instance) => instance.environmentUuid === activeEnvironmentUuid);

      if (!activeEnvironmentInstance) {
        return EMPTY;
      }

      return this.httpClient
        .get<ProcessedDatabucket>(
          `${this.buildRemoteInstanceUrl(activeEnvironmentInstance)}/data-buckets/${databucketUuid}`,
          {
            headers: {
              Authorization: 'Bearer ' + activeEnvironmentInstance.apiKey
            }
          }
        )
        .pipe(map((response) => response.value));
    } else {
      return from(
        this.mainApiService.invoke(
          'APP_SERVER_GET_PROCESSED_DATABUCKET_VALUE',
          activeEnvironmentUuid,
          databucketUuid
        )
      );
    }
  }

  /**
   * Start listening to SSE events from the remote instance
   *
   * @param instance
   * @param sseSubject
   */
  private listenInstanceEvents(instance: DeployInstance) {
    const abortController = new AbortController();

    this.activeSseConnections.set(instance.environmentUuid, {
      subject: new Subject<string>(),
      abortController
    });

    const sseSubject = this.activeSseConnections.get(
      instance.environmentUuid
    )?.subject;

    try {
      fetchEventSource(`${this.buildRemoteInstanceUrl(instance)}/events`, {
        headers: { Authorization: `Bearer ${instance.apiKey}` },
        signal: abortController.signal,
        openWhenHidden: true,
        async onopen(response) {
          if (
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 429
          ) {
            abortController.abort();
            sseSubject.complete();
          }
        },
        onmessage(message) {
          // Do not process empty messages (pings)
          if (!message.data) {
            return;
          }

          sseSubject.next(message.data);
        }
      });
    } catch (_error) {}
  }

  private removeInstanceEventsListener(environmentUuid: string) {
    const connection = this.activeSseConnections.get(environmentUuid);

    if (connection) {
      connection.abortController.abort();
      connection.subject.complete();
      this.activeSseConnections.delete(environmentUuid); // Remove from the map
    }
  }

  private processEvent(environmentUuid: string, eventName: string, data: any) {
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
        this.loggerService.logMessage('error', data.errorCode, {
          error: data.originalError,
          ...loggerMessageParams
        });
        break;
      default:
        break;
    }
  }

  /**
   * Use .appdev locally (in your hosts file, see API docs for more info)
   * as .app always requires HTTPS (due to HSTS mechanism)
   *
   * @param instance
   * @returns
   */
  private buildRemoteInstanceUrl(instance: DeployInstance) {
    return `${instance.url}/mockoon-admin`;
  }
}
