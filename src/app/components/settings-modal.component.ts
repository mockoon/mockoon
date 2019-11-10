import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { Settings, SettingsService } from 'src/app/services/settings.service';
import { Store } from 'src/app/stores/store';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['settings-modal.component.scss']
})
export class SettingsModalComponent implements OnInit, AfterViewInit {
  @ViewChild('modal', { static: false }) modal: ElementRef;
  @Output() closed: EventEmitter<any> = new EventEmitter();
  public settings$: Observable<Settings>;

  constructor(
    private modalService: NgbModal,
    private settingsService: SettingsService,
    private eventsService: EventsService,
    private store: Store) { }

  ngOnInit() {
    this.settings$ = this.store.select('settings');
  }

  ngAfterViewInit() {
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
