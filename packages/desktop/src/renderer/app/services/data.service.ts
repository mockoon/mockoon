import { Injectable } from '@angular/core';
import {
  BINARY_BODY,
  Callback,
  DataBucket,
  Environment,
  EnvironmentSchema,
  GenerateUniqueID,
  HighestMigrationId,
  INDENT_SIZE,
  InFlightRequest,
  Route,
  Transaction,
  generateUUID,
  isContentTypeApplicationJson,
  repairRefs
} from '@mockoon/commons';
import { Logger } from 'src/renderer/app/classes/logger';
import { EnvironmentLog } from 'src/renderer/app/models/environment-logs.model';
import { MigrationService } from 'src/renderer/app/services/migration.service';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { Store } from 'src/renderer/app/stores/store';

@Injectable({ providedIn: 'root' })
export class DataService extends Logger {
  constructor(
    protected toastsService: ToastsService,
    private store: Store,
    private migrationService: MigrationService,
    private settingsService: SettingsService
  ) {
    super('[RENDERER][SERVICE][DATA] ', toastsService);
  }

  /**
   * Migrate an environment and validate it against the schema
   * If migration fails something is missing, it will "repair" the environment
   * using the schema.
   *
   * @param environment
   * @returns
   */
  public migrateAndValidateEnvironment(environment: Environment): Environment {
    let migratedEnvironment: Environment;

    try {
      migratedEnvironment =
        this.migrationService.migrateEnvironment(environment);
    } catch (error) {
      this.logMessage('error', 'ENVIRONMENT_MIGRATION_FAILED', {
        environmentName: environment.name,
        environmentUUID: environment.uuid
      });

      migratedEnvironment = environment;
      migratedEnvironment.lastMigration = HighestMigrationId;
    }
    let validatedEnvironment =
      EnvironmentSchema.validate(migratedEnvironment).value;

    validatedEnvironment = this.deduplicateUUIDs(validatedEnvironment);
    validatedEnvironment = repairRefs(validatedEnvironment);

    this.settingsService.cleanDisabledRoutes(validatedEnvironment);
    this.settingsService.cleanCollapsedFolders(validatedEnvironment);

    return validatedEnvironment;
  }

  /**
   * Creates a new environment log record from given inflight request.
   *
   * @param request
   */
  public formatLogFromInFlightRequest(
    request: InFlightRequest
  ): EnvironmentLog {
    return {
      UUID: request.requestId,
      routeUUID: request.routeUUID,
      timestampMs: Date.now(),
      method: request.request.method as EnvironmentLog['method'],
      url: request.request.urlPath,
      route: request.request.route,
      protocol: 'ws',
      request: {
        isInvalidJson: false, // TODO Isuru
        query: request.request.query,
        body: request.request.body,
        headers: request.request.headers,
        params: request.request.params || [],
        queryParams: request.request.queryParams || []
      },
      response: {
        // we will set a default response of 101 until we figure it out how to capture responses and show them.
        status: 101,
        statusMessage: 'Switching Protocols',
        headers: [],
        body: '{}',
        binaryBody: false,
        isInvalidJson: false
      },
      proxied: false
    };
  }

  /**
   * Format request/response to EnvironmentLog to be consumed by the UI
   *
   * @param response
   */
  public formatLog(transaction: Transaction): EnvironmentLog {
    let isResJsonInvalid = false;
    let isReqJsonInvalid = false;
    let responseBody = transaction.response.body;
    let requestBody = transaction.request.body;

    if (isContentTypeApplicationJson(transaction.response.headers)) {
      try {
        responseBody = JSON.stringify(
          JSON.parse(transaction.response.body),
          null,
          INDENT_SIZE
        );
      } catch (error) {
        isResJsonInvalid = true;
      }
    }

    if (isContentTypeApplicationJson(transaction.request.headers)) {
      try {
        requestBody = JSON.stringify(
          JSON.parse(transaction.request.body),
          null,
          INDENT_SIZE
        );
      } catch (error) {
        isReqJsonInvalid = true;
      }
    }

    return {
      UUID: generateUUID(),
      routeUUID: transaction.routeUUID,
      routeResponseUUID: transaction.routeResponseUUID,
      timestampMs: transaction.timestampMs,
      method: transaction.request.method as EnvironmentLog['method'],
      route: transaction.request.route,
      url: transaction.request.urlPath,
      protocol: 'http',
      request: {
        params: transaction.request.params,
        query: transaction.request.query,
        queryParams: this.formatQueryParams(transaction.request.queryParams),
        body: requestBody,
        headers: transaction.request.headers,
        isInvalidJson: isReqJsonInvalid
      },
      proxied: transaction.proxied,
      response: {
        status: transaction.response.statusCode,
        statusMessage: transaction.response.statusMessage,
        headers: transaction.response.headers,
        body: responseBody,
        binaryBody: transaction.response.body === BINARY_BODY,
        isInvalidJson: isResJsonInvalid
      }
    };
  }

  /**
   * Generate a unused port to a new environment
   */
  public getNewEnvironmentPort(): number {
    const usedPorts = this.store.getEnvironmentsPorts();
    const activeEnvironment: Environment = this.store.getActiveEnvironment();
    const min = Math.ceil(1024);
    const max = Math.floor(65535);
    let testSelectedPort: number;

    if (activeEnvironment == null) {
      testSelectedPort = 3000;
    } else {
      testSelectedPort = activeEnvironment.port + 1;
    }

    for (let i = 0; i < 10; i++) {
      if (testSelectedPort >= 65535) {
        break;
      } else if (!usedPorts.includes(testSelectedPort)) {
        return testSelectedPort;
      }
      testSelectedPort++;
    }

    do {
      testSelectedPort = Math.floor(Math.random() * (max - min)) + min;
    } while (usedPorts.includes(testSelectedPort));

    return testSelectedPort;
  }

  /**
   * Renew one databucket ID
   *
   * @param databucket
   */
  public renewDatabucketID(databucket: DataBucket) {
    databucket.id = GenerateUniqueID();

    return databucket;
  }

  /**
   * Renew the databucket's ID until it is unique
   *
   * @param databucket
   * @returns
   */
  public deduplicateDatabucketID(databucket: DataBucket) {
    const activeEnvironment = this.store.getActiveEnvironment();
    let foundID: DataBucket;

    do {
      databucket = this.renewDatabucketID(databucket);
      foundID = activeEnvironment.data.find(
        (data) => databucket.id === data.id && databucket.uuid !== data.uuid
      );
    } while (foundID);

    return databucket;
  }

  /**
   * Sets a new id to the given callback.
   *
   * @param callback callback reference
   * @returns modified callback reference
   */
  public renewCallbackID(callback: Callback) {
    callback.id = GenerateUniqueID();

    return callback;
  }

  /**
   * Assigns a unique id for the callback.
   *
   * @param callback callback reference
   * @returns callback which has a unique id
   */
  public deduplicateCallbackID(callback: Callback) {
    const activeEnvironment = this.store.getActiveEnvironment();
    let foundID: Callback;

    do {
      callback = this.renewCallbackID(callback);
      foundID = activeEnvironment.callbacks.find(
        (cb) => callback.id === cb.id && callback.uuid !== cb.uuid
      );
    } while (foundID);

    return callback;
  }

  /**
   * Verify that an environment does not contain any duplicated UUID (verify also against all other loaded envs).
   * Will renew UUIDs if needed.
   *
   * @param newEnvironment
   * @param environments
   * @returns
   */
  public deduplicateUUIDs(
    newEnvironment: Environment,
    force = false
  ): Environment {
    const UUIDs = new Set();
    const environments = this.store.get('environments');
    const renewedUUIDs: Record<string, string> = {};

    if (!force) {
      environments.forEach((environment) => {
        UUIDs.add(environment.uuid);

        environment.data.forEach((data) => {
          UUIDs.add(data.uuid);
        });

        environment.routes.forEach((route) => {
          UUIDs.add(route.uuid);

          route.responses.forEach((response) => {
            UUIDs.add(response.uuid);
          });
        });

        environment.folders.forEach((folder) => {
          UUIDs.add(folder.uuid);
        });
      });
    }

    if (force || UUIDs.has(newEnvironment.uuid)) {
      newEnvironment.uuid = generateUUID();
    }
    UUIDs.add(newEnvironment.uuid);

    newEnvironment.data.forEach((data) => {
      if (force || UUIDs.has(data.uuid)) {
        data.uuid = generateUUID();
      }
      UUIDs.add(data.uuid);
    });

    newEnvironment.routes.forEach((route) => {
      if (force || UUIDs.has(route.uuid)) {
        // keep old ref first
        renewedUUIDs[route.uuid] = generateUUID();
        route.uuid = renewedUUIDs[route.uuid];
      }
      UUIDs.add(route.uuid);

      route.responses.forEach((response) => {
        if (force || UUIDs.has(response.uuid)) {
          response.uuid = generateUUID();
        }
        UUIDs.add(response.uuid);
      });
    });

    newEnvironment.folders.forEach((folder) => {
      if (force || UUIDs.has(folder.uuid)) {
        // keep old ref first
        renewedUUIDs[folder.uuid] = generateUUID();
        folder.uuid = renewedUUIDs[folder.uuid];
      }
      UUIDs.add(folder.uuid);
    });

    this.renewRefs(newEnvironment, renewedUUIDs);

    return newEnvironment;
  }

  /**
   * Renew one route UUIDs
   *
   * @param params
   */
  public renewRouteUUIDs(route: Route) {
    route.uuid = generateUUID();

    route.responses.forEach((routeResponse) => {
      routeResponse.uuid = generateUUID();
    });

    return route;
  }

  /**
   * Format query string parameters to return tuples of name-value
   * Name is the path to the query string param element that can be used to
   * access the value in filters or templates
   */
  private formatQueryParams(
    requestParams: Transaction['request']['queryParams']
  ): { name: string; value: string }[] {
    return this.formatQueryParamsWithPrefix('', requestParams);
  }

  /**
   * Format query string parameter object, acessible using key `prefix`
   * If parameter has nested objects, will call self recursively
   */
  private formatQueryParamsWithPrefix(
    prefix: string,
    params: unknown
  ): { name: string; value: string }[] {
    const formattedParams = [];

    Object.entries(params).forEach(([key, value]) =>
      typeof value === 'string'
        ? formattedParams.push({ name: `${prefix}${key}`, value })
        : formattedParams.push(
            ...this.formatQueryParamsWithPrefix(`${prefix}${key}.`, value)
          )
    );

    return formattedParams;
  }

  /**
   * Replace uuids in an array of objects taking new values from a dictionary
   *
   * @param items
   * @param oldNewDict
   */
  private replaceObjectsUUID<T extends { uuid: string }>(
    items: T[],
    oldNewDict: Record<string, string>
  ) {
    return items.map((item) => {
      if (oldNewDict[item.uuid]) {
        item.uuid = oldNewDict[item.uuid];

        return item;
      } else {
        return item;
      }
    });
  }

  /**
   * Renew folders and routes references (in root folders/routes lists, and folders children lists)
   *
   * @param environment
   * @param renewedUUIDs
   */
  private renewRefs(
    environment: Environment,
    renewedUUIDs: Record<string, string>
  ) {
    environment.rootChildren = this.replaceObjectsUUID(
      environment.rootChildren,
      renewedUUIDs
    );

    environment.folders.forEach((folder) => {
      folder.children = this.replaceObjectsUUID(folder.children, renewedUUIDs);
    });
  }
}
