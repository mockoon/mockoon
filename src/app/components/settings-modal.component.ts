import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { FakerLocales } from '@mockoon/commons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { Settings } from 'src/app/models/settings.model';
import { SettingsService } from 'src/app/services/settings.service';
import { Store } from 'src/app/stores/store';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['settings-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsModalComponent implements OnInit {
  @ViewChild('modal', { static: false })
  public modal: ElementRef;
  public settings$: Observable<Settings>;
  public Infinity = Infinity;
  public fakerLocales = FakerLocales;

  constructor(
    private modalService: NgbModal,
    private settingsService: SettingsService,
    private store: Store
  ) {}

  ngOnInit() {
    this.settings$ = this.store.select('settings');
  }

  /**
   * Call the store to update the settings
   *
   * @param newValue
   * @param settingName
   */
  public settingsUpdated(settingNewValue: string, settingName: keyof Settings) {
    this.settingsService.updateSettings({ [settingName]: settingNewValue });
  }

  public showModal() {
    this.modalService
      .open(this.modal, { backdrop: 'static', centered: true, size: 'lg' })
      .result.then(
        () => {},
        () => {}
      );
  }
}
