import { Injectable, NgZone } from '@angular/core';
import { EMPTY, combineLatest } from 'rxjs';
import { catchError, distinctUntilChanged, tap } from 'rxjs/operators';
import { Logger } from 'src/renderer/app/classes/logger';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { ImportExportService } from 'src/renderer/app/services/import-export.service';
import { ToastsService } from 'src/renderer/app/services/toasts.service';
import { TourService } from 'src/renderer/app/services/tour.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { Store } from 'src/renderer/app/stores/store';
import { FileWatcherOptions } from 'src/shared/models/settings.model';

@Injectable({ providedIn: 'root' })
export class ApiService extends Logger {
  constructor(
    private environmentsService: EnvironmentsService,
    private eventsService: EventsService,
    private importExportService: ImportExportService,
    private store: Store,
    private zone: NgZone,
    private userService: UserService,
    protected toastsService: ToastsService,
    private uiService: UIService,
    private tourService: TourService
  ) {
    super('[RENDERER][SERVICE][API] ', toastsService);
  }

  public init() {
    MainAPI.receive('APP_UPDATE_AVAILABLE', (version) => {
      this.zone.run(() => {
        this.eventsService.updateAvailable$.next(version);
      });
    });

    // set listeners on main process messages
    MainAPI.receive('APP_MENU', (action) => {
      this.zone.run(async () => {
        switch (action) {
          case 'NEW_ENVIRONMENT':
            this.environmentsService.addEnvironment().subscribe();
            break;
          case 'NEW_CLOUD_ENVIRONMENT':
            this.environmentsService.addCloudEnvironment().subscribe();
            break;
          case 'NEW_ENVIRONMENT_CLIPBOARD':
            this.environmentsService.newEnvironmentFromClipboard().subscribe();
            break;
          case 'OPEN_ENVIRONMENT':
            this.environmentsService.openEnvironment().subscribe();
            break;
          case 'DUPLICATE_ENVIRONMENT':
            this.environmentsService.duplicateEnvironment().subscribe();
            break;
          case 'CLOSE_ENVIRONMENT':
            this.environmentsService.closeEnvironment().subscribe();
            break;
          case 'NEW_ROUTE':
            this.environmentsService.addHTTPRoute('root');
            break;
          case 'NEW_ROUTE_CLIPBOARD':
            this.environmentsService.addRouteFromClipboard().subscribe();
            break;
          case 'START_ENVIRONMENT':
            this.environmentsService.toggleEnvironment();
            break;
          case 'START_ALL_ENVIRONMENTS':
            this.environmentsService.toggleAllEnvironments();
            break;
          case 'DUPLICATE_ROUTE':
            this.environmentsService.duplicateRoute('root');
            break;
          case 'DELETE_ROUTE':
            this.environmentsService.removeRoute();
            break;
          case 'PREVIOUS_ENVIRONMENT':
            this.environmentsService.setActiveEnvironment('previous');
            break;
          case 'NEXT_ENVIRONMENT':
            this.environmentsService.setActiveEnvironment('next');
            break;
          case 'OPEN_SETTINGS':
            this.uiService.openModal('settings');
            break;
          case 'TOUR_START':
            this.tourService.start();
            break;
          case 'OPEN_CHANGELOG':
            this.uiService.openModal('changelog');
            break;
          case 'IMPORT_OPENAPI_FILE':
            this.importExportService.importOpenAPIFile().subscribe();
            break;
          case 'EXPORT_OPENAPI_FILE':
            this.importExportService.exportOpenAPIFile().subscribe();
            break;
        }
      });
    });

    // listen to custom protocol queries
    MainAPI.receive('APP_CUSTOM_PROTOCOL', (action, parameters) => {
      this.zone.run(() => {
        switch (action) {
          case 'auth':
            this.userService
              .authWithToken(parameters.token)
              .pipe(
                tap(() => {
                  this.uiService.closeModal('auth');
                  this.logMessage('info', 'LOGIN_SUCCESS');
                }),
                catchError(() => {
                  this.logMessage('error', 'LOGIN_ERROR');

                  return EMPTY;
                })
              )
              .subscribe();
            break;
          case 'load-environment':
            this.environmentsService
              .newEnvironmentFromURL(parameters.url)
              .subscribe();
            break;
        }
      });
    });

    // listen to file external changes
    MainAPI.receive(
      'APP_FILE_EXTERNAL_CHANGE',
      (UUID: string, environmentPath: string) => {
        this.zone.run(() => {
          if (
            this.store.get('settings').fileWatcherEnabled ===
            FileWatcherOptions.AUTO
          ) {
            this.environmentsService
              .reloadEnvironment(UUID, environmentPath)
              .subscribe();
          } else if (
            this.store.get('settings').fileWatcherEnabled ===
            FileWatcherOptions.PROMPT
          ) {
            this.environmentsService
              .notifyExternalChange(UUID, environmentPath)
              .subscribe();
          }
        });
      }
    );

    // listen to environments and enable/disable some menu entries
    combineLatest([
      this.store.select('environments').pipe(distinctUntilChanged()),
      this.store.selectActiveEnvironment().pipe(distinctUntilChanged()),
      this.store.select('settings').pipe(distinctUntilChanged()),
      this.store.select('sync').pipe(distinctUntilChanged())
    ])
      .pipe(
        tap(([environments, activeEnvironment, settings, sync]) => {
          MainAPI.send('APP_UPDATE_MENU_STATE', {
            cloudEnabled: sync.status,
            environmentsCount: environments.length,
            hasActiveEnvironment: !!activeEnvironment,
            isActiveEnvironmentCloud: activeEnvironment
              ? !!settings?.environments.find(
                  (environmentDescriptor) =>
                    environmentDescriptor.uuid === activeEnvironment.uuid &&
                    environmentDescriptor.cloud
                )
              : false,
            activeEnvironmentRoutesCount: activeEnvironment?.routes.length ?? 0
          });
        })
      )
      .subscribe();
  }
}
