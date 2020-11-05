import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ipcRenderer } from 'electron';
import { distinctUntilChanged, tap } from 'rxjs/operators';
import { ChangelogModalComponent } from 'src/app/components/changelog-modal.component';
import { SettingsModalComponent } from 'src/app/components/settings-modal.component';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { ImportExportService } from 'src/app/services/import-export.service';
import { UIService } from 'src/app/services/ui.service';
import { Store } from 'src/app/stores/store';
import { ScrollDirection } from 'src/app/models/ui.model';

@Injectable({ providedIn: 'root' })
export class IpcService {
  constructor(
    private environmentsService: EnvironmentsService,
    private modalService: NgbModal,
    private importExportService: ImportExportService,
    private uiService: UIService,
    private store: Store
  ) {}

  public init(
    changelogModal: ChangelogModalComponent,
    settingsModal: SettingsModalComponent
  ) {
    // set listeners on main process messages
    ipcRenderer.on('keydown', (event, data) => {
      switch (data.action) {
        case 'NEW_ENVIRONMENT':
          this.environmentsService.addEnvironment();
          this.uiService.scrollEnvironmentsMenu.next(ScrollDirection.BOTTOM);
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
        case 'DUPLICATE_ENVIRONMENT':
          this.environmentsService.duplicateEnvironment();
          break;
        case 'DUPLICATE_ROUTE':
          this.environmentsService.duplicateRoute();
          break;
        case 'DELETE_ENVIRONMENT':
          this.environmentsService.removeEnvironment();
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
          this.importExportService.importFromClipboard();
          break;
        case 'EXPORT_FILE':
          this.importExportService.exportAllEnvironments();
          break;
        case 'EXPORT_FILE_SELECTED':
          this.importExportService.exportActiveEnvironment();
          break;
      }
    });

    // listen to environments and enable/disable export menu entries
    this.store
      .select('environments')
      .pipe(
        distinctUntilChanged(),
        tap((environments) => {
          this.sendMessage(
            environments.length >= 1 ? 'enable-export' : 'disable-export'
          );
        })
      )
      .subscribe();
  }

  /**
   * Send a messgae to main process
   *
   * @param channel
   */
  private sendMessage(channel: 'enable-export' | 'disable-export') {
    ipcRenderer.send(channel);
  }
}
