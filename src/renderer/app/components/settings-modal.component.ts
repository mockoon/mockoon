import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { Config } from 'src/renderer/app/config';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { FakerLocales } from 'src/renderer/app/constants/faker.constants';
import { Settings } from 'src/renderer/app/models/settings.model';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['settings-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsModalComponent implements OnInit {
  @ViewChild('modal')
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

  public openWikiLink(linkName: string) {
    MainAPI.send('APP_OPEN_EXTERNAL_LINK', Config.docs[linkName]);
  }
}
