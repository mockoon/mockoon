import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { SettingsService, SettingsType } from 'src/app/services/settings.service';
import { Store } from 'src/app/stores/store';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html'
})
export class SettingsModalComponent implements OnInit {
  @ViewChild('modal') modal: ElementRef;
  @Output() closed: EventEmitter<any> = new EventEmitter();
  public settings$: Observable<SettingsType>;

  constructor(
    private modalService: NgbModal,
    private settingsService: SettingsService,
    private eventsService: EventsService,
    private store: Store) { }

  ngOnInit() {
    this.settings$ = this.store.select('settings');

    this.eventsService.settingsModalEvents.subscribe(() => {
      this.modalService.open(this.modal, { backdrop: 'static', centered: true }).result.then(() => {
        this.closed.emit();
      }, () => { });
    });
  }

  /**
   * Call the store to update the settings
   *
   * @param newValue
   * @param settingName
   */
  public settingsUpdated(settingNewValue: string, settingName: string) {
    this.settingsService.updateSettings({ [settingName]: settingNewValue });
  }
}
