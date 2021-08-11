import { Injectable, NgZone } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { ChangelogModalComponent } from 'src/renderer/app/components/changelog-modal.component';
import { SettingsModalComponent } from 'src/renderer/app/components/settings-modal.component';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { ImportExportService } from 'src/renderer/app/services/import-export.service';
import { Store } from 'src/renderer/app/stores/store';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private environmentsService: EnvironmentsService,
    private eventsService: EventsService,
    private modalService: NgbModal,
    private importExportService: ImportExportService,
    private store: Store,
    private zone: NgZone
  ) {}

  public init(
    changelogModal: ChangelogModalComponent,
    settingsModal: SettingsModalComponent
  ) {
    MainAPI.receive('APP_UPDATE_AVAILABLE', () => {
      this.zone.run(() => {
        this.eventsService.updateAvailable$.next(true);
      });
    });

    // set listeners on main process messages
    MainAPI.receive('APP_MENU', (action) => {
      this.zone.run(async () => {
        switch (action) {
          case 'NEW_ENVIRONMENT':
            this.environmentsService.addEnvironment().subscribe();
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
            this.environmentsService.addRoute();
            break;
          case 'START_ENVIRONMENT':
            this.environmentsService.toggleActiveEnvironment();
            break;
          case 'START_ALL_ENVIRONMENTS':
            this.environmentsService.toggleAllEnvironments();
            break;
          case 'DUPLICATE_ROUTE':
            this.environmentsService.duplicateRoute();
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
          case 'PREVIOUS_ROUTE':
            this.environmentsService.setActiveRoute('previous');
            break;
          case 'NEXT_ROUTE':
            this.environmentsService.setActiveRoute('next');
            break;
          case 'OPEN_SETTINGS':
            this.modalService.dismissAll();
            settingsModal.showModal();
            break;
          case 'OPEN_CHANGELOG':
            this.modalService.dismissAll();
            changelogModal.showModal();
            break;
          case 'IMPORT_FILE':
            this.importExportService.importFromFile();
            break;
          case 'IMPORT_OPENAPI_FILE':
            this.importExportService.importOpenAPIFile();
            break;
          case 'EXPORT_OPENAPI_FILE':
            this.importExportService.exportOpenAPIFile();
            break;
          case 'IMPORT_CLIPBOARD':
            await this.importExportService.importFromClipboard();
            break;
          case 'EXPORT_FILE':
            this.importExportService.exportAllEnvironments();
            break;
          case 'EXPORT_FILE_SELECTED':
            this.importExportService.exportActiveEnvironment();
            break;
        }
      });
    });

    // listen to environments and enable/disable some menu entries
    this.store
      .select('environments')
      .pipe(
        distinctUntilChanged(),
        tap((environments) => {
          MainAPI.send(
            environments.length >= 1
              ? 'APP_ENABLE_ENVIRONMENT_MENU_ENTRIES'
              : 'APP_DISABLE_ENVIRONMENT_MENU_ENTRIES'
          );
        })
      )
      .subscribe();

    this.store
      .selectActiveEnvironment()
      .pipe(
        filter((activeEnvironment) => !!activeEnvironment),
        distinctUntilChanged(),
        map((activeEnvironment) => activeEnvironment.routes),
        tap((routes) => {
          MainAPI.send(
            routes.length >= 1
              ? 'APP_ENABLE_ROUTE_MENU_ENTRIES'
              : 'APP_DISABLE_ROUTE_MENU_ENTRIES'
          );
        })
      )
      .subscribe();
  }
}
