import { Injectable, NgZone } from '@angular/core';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, tap } from 'rxjs/operators';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { ImportExportService } from 'src/renderer/app/services/import-export.service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { TourService } from 'src/renderer/app/services/tour.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { FileWatcherOptions } from 'src/shared/models/settings.model';

@Injectable({ providedIn: 'root' })
export class MainApiListenerService {
  constructor(
    private environmentsService: EnvironmentsService,
    private eventsService: EventsService,
    private importExportService: ImportExportService,
    private store: Store,
    private zone: NgZone,
    private userService: UserService,
    private uiService: UIService,
    private tourService: TourService,
    private mainApiService: MainApiService
  ) {}

  public init() {
    if (!Config.isWeb) {
      this.mainApiService.receive('APP_UPDATE_AVAILABLE', (version) => {
        this.zone.run(() => {
          this.eventsService.updateAvailable$.next(version);
        });
      });
      this.mainApiService.receive('APP_AUTH_CALLBACK', (token) => {
        this.zone.run(() => {
          this.userService.authCallbackHandler(token).subscribe();
        });
      });

      // set listeners on main process messages
      this.mainApiService.receive('APP_MENU', (action) => {
        this.zone.run(async () => {
          switch (action) {
            case 'NEW_ENVIRONMENT':
              this.environmentsService
                .addEnvironment({ setActive: true })
                .subscribe();
              break;
            case 'NEW_CLOUD_ENVIRONMENT':
              this.environmentsService
                .addCloudEnvironment(null, true)
                .subscribe();
              break;
            case 'NEW_ENVIRONMENT_CLIPBOARD':
              this.environmentsService
                .newEnvironmentFromClipboard()
                .subscribe();
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
      this.mainApiService.receive(
        'APP_CUSTOM_PROTOCOL',
        (action, parameters) => {
          this.zone.run(() => {
            switch (action) {
              case 'auth':
                this.userService
                  .authCallbackHandler(parameters.token)
                  .subscribe();
                break;
              case 'load-environment':
                this.environmentsService
                  .newEnvironmentFromURL(parameters.url)
                  .subscribe();
                break;
            }
          });
        }
      );

      // listen to file external changes
      this.mainApiService.receive(
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
            this.mainApiService.send('APP_UPDATE_MENU_STATE', {
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
              activeEnvironmentRoutesCount:
                activeEnvironment?.routes.length ?? 0
            });
          })
        )
        .subscribe();
    }
  }
}
