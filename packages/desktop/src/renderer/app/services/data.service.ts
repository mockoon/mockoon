import { Injectable } from '@angular/core';
import {
  BINARY_BODY,
  Callback,
  Cookie,
  DataBucket,
  Environment,
  EnvironmentSchema,
  GenerateUniqueID,
  generateUUID,
  Header,
  HighestMigrationId,
  INDENT_SIZE,
  isContentTypeApplicationJson,
  repairRefs,
  Route,
  Transaction
} from '@mockoon/commons';
import { Logger } from 'src/renderer/app/classes/logger';
import {
  EnvironmentLog,
  EnvironmentLogRequest,
  HAR,
  HARCookie,
  HARPage,
  HARParam,
  HARPostData
} from 'src/renderer/app/models/environment-logs.model';
import { MigrationService } from 'src/renderer/app/services/migration.service';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

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
      fullUrl: transaction.request.fullUrl,
      proxyUrl: transaction.request.proxyUrl,
      request: {
        params: transaction.request.params,
        query: transaction.request.query,
        queryParams: this.formatQueryParams(transaction.request.queryParams),
        body: requestBody,
        headers: transaction.request.headers,
        isInvalidJson: isReqJsonInvalid,
        httpVersion: transaction.request.httpVersion,
        mimeType: transaction.request.mimeType,
        cookies: transaction.request.cookies,
        startedAt: transaction.request.startedAt
      },
      proxied: transaction.proxied,
      response: {
        status: transaction.response.statusCode,
        statusMessage: transaction.response.statusMessage,
        headers: transaction.response.headers,
        body: responseBody,
        binaryBody: transaction.response.body === BINARY_BODY,
        isInvalidJson: isResJsonInvalid,
        cookies: transaction.response.cookies
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
    const renewedUUIDs: { [key: string]: string } = {};

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

  public formatHAR(environmentLogs: EnvironmentLog[]): HAR {
    return {
      log: {
        version: 1.2,
        creator: {
          name: 'Mockoon',
          version: Config.appVersion
        },
        pages: this.formatHARPages(environmentLogs),
        entries: environmentLogs.map((environmentLog) => {
          const time =
            environmentLog.timestampMs -
            environmentLog.request.startedAt.getTime();

          return {
            pageref: environmentLog.routeUUID,
            startedDateTime: environmentLog.request.startedAt.toISOString(),
            time,
            request: {
              method: environmentLog.method.toUpperCase(),
              url: environmentLog.fullUrl,
              httpVersion: environmentLog.request.httpVersion,
              cookies: this.formatHARCookies(environmentLog.request.cookies),
              headers: this.formatHARHeaders(environmentLog.request.headers),
              queryString: environmentLog.request.queryParams,
              postData: this.formatHARPostData(environmentLog.request),
              headersSize: -1,
              bodySize: environmentLog.request.body.length
            },
            response: {
              status: environmentLog.response.status,
              statusText: environmentLog.response.statusMessage,
              httpVersion: environmentLog.request.httpVersion,
              cookies: this.formatHARCookies(environmentLog.response.cookies),
              headers: this.formatHARHeaders(environmentLog.response.headers),
              content: {
                size: environmentLog.response.body.length,
                mimeType: 'application/json',
                text:
                  environmentLog.response.body.length > 0
                    ? environmentLog.response.body
                    : undefined
              },
              redirectURL: environmentLog.proxyUrl ?? '',
              headersSize: -1,
              bodySize: -1
            },
            cache: {},
            timings: {
              send: 0,
              wait: time,
              receive: 0
            }
          };
        })
      }
    };
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
    oldNewDict: { [key: string]: string }
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
    renewedUUIDs: { [key: string]: string }
  ) {
    environment.rootChildren = this.replaceObjectsUUID(
      environment.rootChildren,
      renewedUUIDs
    );

    environment.folders.forEach((folder) => {
      folder.children = this.replaceObjectsUUID(folder.children, renewedUUIDs);
    });
  }

  private formatHARPages(environmentLogs: EnvironmentLog[]): HARPage[] {
    const routes: Map<string, EnvironmentLog> = new Map<
      string,
      EnvironmentLog
    >();

    environmentLogs.forEach((environmentLog) => {
      if (
        !routes.has(environmentLog.routeUUID) ||
        routes.get(environmentLog.routeUUID).timestampMs >
          environmentLog.timestampMs
      ) {
        routes.set(environmentLog.routeUUID, environmentLog);
      }
    });

    return Array.from(routes.values()).map((environmentLog) => ({
      startedDateTime: environmentLog.request.startedAt.toISOString(),
      id: environmentLog.routeUUID,
      title: environmentLog.route,
      pageTimings: {}
    }));
  }

  private formatHARHeaders(headers: Header[]): any[] {
    return (
      headers?.map((header) => ({
        name: header.key,
        value: header.value
      })) ?? []
    );
  }

  private formatHARCookies(cookies: Cookie[]): HARCookie[] {
    return (
      cookies?.map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        domain: cookie.domain,
        expires:
          cookie.expires !== undefined
            ? new Date(cookie.expires).toISOString()
            : undefined,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure
      })) ?? []
    );
  }

  private formatHARPostData(request: EnvironmentLogRequest): HARPostData {
    if (request.body.length === 0) {
      return undefined;
    }

    const params: HARParam[] = [];

    if (request.mimeType === 'application/x-www-form-urlencoded') {
      const bodyParams = request.body.split('&');

      bodyParams.forEach((bodyParam) => {
        const [name, value] = bodyParam.split('=');
        params.push({ name, value });
      });
    }

    return {
      mimeType: request.mimeType ?? 'text/plain',
      params: params.length > 0 ? params : undefined,
      text: params.length === 0 ? request.body : undefined
    };
  }
}
