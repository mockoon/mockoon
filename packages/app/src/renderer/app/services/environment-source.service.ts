import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import {
  Environment,
  INDENT_SIZE,
  deterministicStringify
} from '@mockoon/commons';
import { EMPTY, Observable, from, merge, of } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { DropdownMenuItem } from 'src/renderer/app/components/dropdown-menu/dropdown-menu.component';
import { DataService } from 'src/renderer/app/services/data.service';
import { DialogsService } from 'src/renderer/app/services/dialogs.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { LoggerService } from 'src/renderer/app/services/logger-service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { ServerService } from 'src/renderer/app/services/server.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import {
  reloadEnvironmentAction,
  updateSettingsEnvironmentDescriptorAction
} from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

type EnvironmentMenuPayload = { environmentUuid: string };

@Service()
export class EnvironmentSourceService {
  private environmentsService = inject(EnvironmentsService);
  private dataService = inject(DataService);
  private dialogsService = inject(DialogsService);
  private serverService = inject(ServerService);
  private mainApiService = inject(MainApiService);
  private loggerService = inject(LoggerService);
  private uiService = inject(UIService);
  private store = inject(Store);
  private http = inject(HttpClient);

  public newEnvironmentMenuItems: DropdownMenuItem[] = [
    {
      label: 'New local environment from URL',
      icon: 'public',
      twoSteps: false,
      action: () => {
        this.uiService.openModal('environmentUrl');
      }
    }
  ];
  public environmentMenuItems: DropdownMenuItem[] = [
    {
      label: 'Refresh from URL',
      icon: 'refresh',
      twoSteps: false,
      hidden$: ({ environmentUuid }: EnvironmentMenuPayload) =>
        this.store
          .select('settings')
          .pipe(
            map(
              (settings) =>
                !settings?.environments.find(
                  (environmentDescriptor) =>
                    environmentDescriptor.uuid === environmentUuid
                )?.sourceUrl
            )
          ),
      action: ({ environmentUuid }: EnvironmentMenuPayload) => {
        this.requestEnvironmentRefreshFromURL(environmentUuid).subscribe();
      }
    },
    {
      label: 'Export to file',
      icon: 'file_download',
      twoSteps: false,
      action: ({ environmentUuid }: EnvironmentMenuPayload) => {
        this.exportEnvironmentForSource(environmentUuid).subscribe();
      }
    }
  ];

  /**
   * Open an environment from a URL
   *
   * @param url
   * @returns
   */
  public newEnvironmentFromURL(url: string) {
    if (url) {
      return this.dialogsService
        .showSaveDialog('Save your new environment')
        .pipe(
          filter((filePath) => !!filePath),
          switchMap((filePath) => {
            this.loggerService.logMessage('info', 'NEW_ENVIRONMENT_FROM_URL', {
              url
            });

            return this.http.get(url, { responseType: 'text' }).pipe(
              map<string, Environment>((data) => JSON.parse(data)),
              switchMap((environment: Environment) =>
                this.environmentsService.verifyData(environment)
              ),
              switchMap((environment: Environment) => {
                const migratedEnvironment =
                  this.dataService.migrateAndValidateEnvironment(environment);

                return this.environmentsService
                  .addEnvironment({
                    environment: migratedEnvironment,
                    filePath,
                    promptSave: false,
                    setActive: true
                  })
                  .pipe(
                    switchMap(({ newEnvironment }) =>
                      this.getEnvironmentHash(newEnvironment).pipe(
                        tap((sourceHash) => {
                          this.store.update(
                            updateSettingsEnvironmentDescriptorAction({
                              uuid: newEnvironment.uuid,
                              sourceUrl: url,
                              sourceHash
                            })
                          );
                        })
                      )
                    )
                  );
              })
            );
          }),
          catchError((error) => {
            this.loggerService.logMessage(
              'error',
              'NEW_ENVIRONMENT_URL_ERROR',
              {
                error
              }
            );

            return EMPTY;
          })
        );
    }

    return EMPTY;
  }

  /**
   * Refresh an environment from its source URL, overwriting local changes
   *
   * @param environmentUuid
   * @returns
   */
  public refreshEnvironmentFromURL(environmentUuid: string) {
    const environmentDescriptor =
      this.getEnvironmentDescriptor(environmentUuid);

    if (!environmentDescriptor?.sourceUrl) {
      return EMPTY;
    }

    return this.http
      .get(environmentDescriptor.sourceUrl, { responseType: 'text' })
      .pipe(
        map<string, Environment>((data) => JSON.parse(data)),
        switchMap((environment: Environment) =>
          this.environmentsService.verifyData(environment)
        ),
        map((environment: Environment) =>
          this.dataService.migrateAndValidateEnvironment(
            environment,
            environmentUuid
          )
        ),
        tap((newEnvironment) => {
          const environmentStatus =
            this.store.getEnvironmentStatus(environmentUuid);

          if (environmentStatus?.running) {
            this.serverService.stop(environmentUuid);
          }

          if (newEnvironment.uuid !== environmentUuid) {
            this.mainApiService.invoke('APP_UNWATCH_FILE', environmentUuid);
          }

          this.store.update(
            reloadEnvironmentAction(environmentUuid, newEnvironment)
          );

          if (environmentStatus?.running) {
            this.serverService.start(
              newEnvironment,
              environmentDescriptor.path
            );
          }
        }),
        switchMap((newEnvironment) =>
          this.getEnvironmentHash(newEnvironment).pipe(
            tap((sourceHash) => {
              this.store.update(
                updateSettingsEnvironmentDescriptorAction({
                  uuid: newEnvironment.uuid,
                  sourceHash
                })
              );

              this.loggerService.logMessage(
                'info',
                'ENVIRONMENT_URL_REFRESH_SUCCESS',
                { environmentName: newEnvironment.name }
              );
            }),
            map(() => newEnvironment)
          )
        ),
        catchError((error) => {
          this.loggerService.logMessage(
            'error',
            'ENVIRONMENT_URL_REFRESH_ERROR',
            {
              error
            }
          );

          return EMPTY;
        })
      );
  }

  /**
   * Refresh an environment from its source URL, asking the user what to do
   * if the environment has local changes
   *
   * @param environmentUuid
   * @returns
   */
  public requestEnvironmentRefreshFromURL(environmentUuid: string) {
    return this.hasLocalChanges(environmentUuid).pipe(
      switchMap((hasLocalChanges) => {
        if (hasLocalChanges) {
          this.uiService.openModal('environmentRefresh', environmentUuid);

          return EMPTY;
        }

        return this.refreshEnvironmentFromURL(environmentUuid);
      })
    );
  }

  /**
   * Refresh all local environments having a source URL.
   * Environments with local changes are skipped.
   *
   * @returns
   */
  public refreshAllEnvironmentsFromURL() {
    return merge(
      ...this.store
        .get('settings')
        .environments.filter(
          (environmentDescriptor) =>
            !!environmentDescriptor.sourceUrl && !environmentDescriptor.cloud
        )
        .map((environmentDescriptor) =>
          this.hasLocalChanges(environmentDescriptor.uuid).pipe(
            switchMap((hasLocalChanges) => {
              if (hasLocalChanges) {
                this.loggerService.logMessage(
                  'info',
                  'ENVIRONMENT_URL_REFRESH_SKIPPED',
                  {
                    environmentName: this.store.getEnvironmentByUUID(
                      environmentDescriptor.uuid
                    )?.name
                  }
                );

                return EMPTY;
              }

              return this.refreshEnvironmentFromURL(environmentDescriptor.uuid);
            })
          )
        )
    );
  }

  /**
   * Check if an environment changed since it was last loaded from its source URL
   *
   * @param environmentUuid
   * @returns
   */
  public hasLocalChanges(environmentUuid: string): Observable<boolean> {
    const environment = this.store.getEnvironmentByUUID(environmentUuid);
    const environmentDescriptor =
      this.getEnvironmentDescriptor(environmentUuid);

    if (!environment || !environmentDescriptor?.sourceHash) {
      return of(false);
    }

    return this.getEnvironmentHash(environment).pipe(
      map((hash) => hash !== environmentDescriptor.sourceHash)
    );
  }

  /**
   * Export an environment JSON to a file, using the same formatting and
   * filename as its source URL file when available, to keep diffs minimal
   *
   * @param environmentUuid
   * @returns
   */
  public exportEnvironmentForSource(environmentUuid: string) {
    const environment = this.store.getEnvironmentByUUID(environmentUuid);
    const environmentDescriptor =
      this.getEnvironmentDescriptor(environmentUuid);
    const sourceUrl = environmentDescriptor?.sourceUrl;

    if (!environment) {
      return EMPTY;
    }

    return this.hasLocalChanges(environmentUuid).pipe(
      switchMap((hasLocalChanges) => {
        if (sourceUrl && !hasLocalChanges) {
          this.loggerService.logMessage(
            'info',
            'ENVIRONMENT_EXPORT_NO_CHANGES',
            { environmentName: environment.name }
          );

          return EMPTY;
        }

        return sourceUrl
          ? this.http
              .get(sourceUrl, { responseType: 'text' })
              .pipe(catchError(() => of<string>(null)))
          : of<string>(null);
      }),
      switchMap((sourceContent) => {
        const data = this.stringifyLikeSource(environment, sourceContent);

        return this.dialogsService
          .showSaveDialog(
            'Export environment to JSON Mockoon format',
            false,
            'json',
            this.getFilenameFromURL(sourceUrl) ??
              `${environment.name || 'environment'}.json`
          )
          .pipe(
            filter((filePath) => !!filePath),
            switchMap((filePath) =>
              from(this.mainApiService.invoke('APP_WRITE_FILE', filePath, data))
            ),
            tap(() => {
              this.loggerService.logMessage('info', 'EXPORT_SUCCESS', {
                environmentName: environment.name
              });

              if (
                this.getSourceLastMigration(sourceContent) <
                environment.lastMigration
              ) {
                this.loggerService.logMessage(
                  'info',
                  'ENVIRONMENT_EXPORT_MIGRATION_DIFF',
                  { environmentName: environment.name }
                );
              }
            }),
            map(() => true)
          );
      }),
      catchError((error) => {
        this.loggerService.logMessage('error', 'ENVIRONMENT_EXPORT_ERROR', {
          error
        });

        return EMPTY;
      })
    );
  }

  /**
   * Get the settings descriptor of an environment
   *
   * @param environmentUuid
   * @returns
   */
  private getEnvironmentDescriptor(environmentUuid: string) {
    return this.store
      .get('settings')
      .environments.find(
        (environmentItem) => environmentItem.uuid === environmentUuid
      );
  }

  /**
   * Compute a deterministic hash of an environment content
   *
   * @param environment
   * @returns
   */
  private getEnvironmentHash(environment: Environment): Observable<string> {
    return from(
      this.mainApiService.invoke(
        'APP_GET_HASH',
        deterministicStringify(environment)
      )
    );
  }

  /**
   * Serialize an environment reusing the indentation, line endings and final
   * newline of the source file content
   *
   * @param environment
   * @param sourceContent
   * @returns
   */
  private stringifyLikeSource(
    environment: Environment,
    sourceContent: string | null
  ) {
    if (!sourceContent) {
      return JSON.stringify(environment, null, INDENT_SIZE);
    }

    const content = sourceContent.replace(/^\uFEFF/, '');
    const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
    const indentMatch = content.match(/^\s*[{[]\r?\n([ \t]+)/);
    const indent = indentMatch
      ? indentMatch[1]
      : content.trim().includes('\n')
        ? INDENT_SIZE
        : undefined;
    let data = JSON.stringify(environment, null, indent);

    if (lineEnding !== '\n') {
      data = data.replace(/\n/g, lineEnding);
    }

    if (/\r?\n$/.test(content)) {
      data += lineEnding;
    }

    return data;
  }

  /**
   * Extract the filename from a URL path
   *
   * @param url
   * @returns
   */
  private getFilenameFromURL(url?: string | null): string | null {
    if (!url) {
      return null;
    }

    try {
      return (
        decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '') || null
      );
    } catch {
      return null;
    }
  }

  /**
   * Read the lastMigration of a source file content
   *
   * @param sourceContent
   * @returns
   */
  private getSourceLastMigration(sourceContent: string | null): number {
    try {
      return JSON.parse(sourceContent)?.lastMigration ?? Infinity;
    } catch {
      return Infinity;
    }
  }
}
