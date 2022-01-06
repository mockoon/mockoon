import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { merge, Observable, Subject } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { FakerLocales } from 'src/renderer/app/constants/faker.constants';
import { SettingsDefault } from 'src/renderer/app/constants/settings-schema.constants';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/shared/config';
import { Settings } from 'src/shared/models/settings.model';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['settings-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsModalComponent implements OnInit, OnDestroy {
  @ViewChild('modal')
  public modal: ElementRef;
  public settings$: Observable<Settings>;
  public Infinity = Infinity;
  public fakerLocales = FakerLocales;
  public settingsForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private settingsService: SettingsService,
    private store: Store
  ) {}

  ngOnInit() {
    this.settings$ = this.store.select('settings');

    this.initForms();
    this.initFormValues();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
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
    this.modalService.open(this.modal, {
      size: 'lg'
    });
  }

  public openWikiLink(linkName: string, event: MouseEvent) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    MainAPI.send('APP_OPEN_EXTERNAL_LINK', Config.docs[linkName]);
  }

  /**
   * Init active environment form and subscribe to changes
   */
  private initForms() {
    this.settingsForm = this.formBuilder.group({
      truncateRouteName: [SettingsDefault.truncateRouteName],
      maxLogsPerEnvironment: [SettingsDefault.maxLogsPerEnvironment],
      logSizeLimit: [SettingsDefault.logSizeLimit],
      fakerLocale: [SettingsDefault.fakerLocale],
      fakerSeed: [SettingsDefault.fakerSeed],
      storagePrettyPrint: [SettingsDefault.storagePrettyPrint],
      analytics: [SettingsDefault.analytics],
      enableTelemetry: [SettingsDefault.enableTelemetry]
    });

    // send new activeEnvironmentForm values to the store, one by one
    merge(
      ...Object.keys(this.settingsForm.controls).map((controlName) =>
        this.settingsForm.get(controlName).valueChanges.pipe(
          map((newValue) => ({
            [controlName]: newValue
          }))
        )
      )
    )
      .pipe(
        tap((newProperty) => {
          this.settingsService.updateSettings(newProperty);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Listen to stores to init form values
   */
  private initFormValues() {
    // subscribe to active environment changes to reset the form
    this.settings$
      .pipe(
        filter((settings) => !!settings),
        tap((settings) => {
          this.settingsForm.setValue(
            {
              truncateRouteName: settings.truncateRouteName,
              maxLogsPerEnvironment: settings.maxLogsPerEnvironment,
              logSizeLimit: settings.logSizeLimit,
              fakerLocale: settings.fakerLocale,
              fakerSeed: settings.fakerSeed,
              storagePrettyPrint: settings.storagePrettyPrint,
              analytics: settings.analytics,
              enableTelemetry: settings.enableTelemetry
            },
            { emitEvent: false }
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
}
