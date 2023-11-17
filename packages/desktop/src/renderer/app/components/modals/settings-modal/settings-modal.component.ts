import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Observable, Subject, merge } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { FakerLocales } from 'src/renderer/app/constants/faker.constants';
import { SettingsDefault } from 'src/renderer/app/constants/settings-schema.constants';
import { DropdownItems } from 'src/renderer/app/models/common.model';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { FileWatcherOptions, Settings } from 'src/shared/models/settings.model';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['settings-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsModalComponent implements OnInit, OnDestroy {
  public settings$: Observable<Settings>;
  public Infinity = Infinity;
  public fakerLocales: DropdownItems = FakerLocales;
  public fileWatcherOptions: DropdownItems = [
    { value: FileWatcherOptions.DISABLED, label: 'Disabled' },
    { value: FileWatcherOptions.PROMPT, label: 'Prompt' },
    { value: FileWatcherOptions.AUTO, label: 'Auto' }
  ];
  public settingsForm: UntypedFormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private settingsService: SettingsService,
    private store: Store,
    private uiService: UIService
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

  public openWikiLink(linkName: string, event: MouseEvent) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    MainAPI.send('APP_OPEN_EXTERNAL_LINK', Config.docs[linkName]);
  }

  public close() {
    this.uiService.closeModal('settings');
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
      fileWatcherEnabled: [SettingsDefault.fileWatcherEnabled],
      storagePrettyPrint: [SettingsDefault.storagePrettyPrint],
      enableTelemetry: [SettingsDefault.enableTelemetry],
      startEnvironmentsOnLoad: [SettingsDefault.startEnvironmentsOnLoad],
      logTransactions: [SettingsDefault.logTransactions]
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
              fileWatcherEnabled: settings.fileWatcherEnabled,
              storagePrettyPrint: settings.storagePrettyPrint,
              enableTelemetry: settings.enableTelemetry,
              startEnvironmentsOnLoad: settings.startEnvironmentsOnLoad,
              logTransactions: settings.logTransactions
            },
            { emitEvent: false }
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
}
