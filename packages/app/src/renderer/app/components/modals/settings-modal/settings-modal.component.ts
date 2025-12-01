import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup
} from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Observable, merge } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { CustomSelectComponent } from 'src/renderer/app/components/custom-select/custom-select.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { TitleSeparatorComponent } from 'src/renderer/app/components/title-separator/title-separator.component';
import { FakerLocales } from 'src/renderer/app/constants/faker.constants';
import { SettingsDefault } from 'src/renderer/app/constants/settings-schema.constants';
import { InputNumberDirective } from 'src/renderer/app/directives/input-number.directive';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TitleSeparatorComponent,
    SvgComponent,
    NgbTooltip,
    InputNumberDirective,
    CustomSelectComponent
  ]
})
export class SettingsModalComponent {
  private formBuilder = inject(UntypedFormBuilder);
  private settingsService = inject(SettingsService);
  private store = inject(Store);
  private uiService = inject(UIService);
  public settings$: Observable<Settings>;
  public Infinity = Infinity;
  public faqUrl = Config.docs.faq;
  public fakerLocales: DropdownItems = FakerLocales;
  public fileWatcherOptions: DropdownItems = [
    { value: FileWatcherOptions.DISABLED, label: 'Disabled' },
    { value: FileWatcherOptions.PROMPT, label: 'Prompt' },
    { value: FileWatcherOptions.AUTO, label: 'Auto' }
  ];
  public settingsForm: UntypedFormGroup;
  public isWeb = Config.isWeb;
  public maxLogsPerEnvironmentLimit = Config.maxLogsPerEnvironmentLimit;

  constructor() {
    this.settings$ = this.store
      .select('settings')
      .pipe(filter((settings) => !!settings));

    this.settingsForm = this.formBuilder.group({
      truncateRouteName: [SettingsDefault.truncateRouteName],
      maxLogsPerEnvironment: [SettingsDefault.maxLogsPerEnvironment],
      fakerLocale: [SettingsDefault.fakerLocale],
      fakerSeed: [SettingsDefault.fakerSeed],
      fileWatcherEnabled: [SettingsDefault.fileWatcherEnabled],
      storagePrettyPrint: [SettingsDefault.storagePrettyPrint],
      enableTelemetry: [SettingsDefault.enableTelemetry],
      startEnvironmentsOnLoad: [SettingsDefault.startEnvironmentsOnLoad],
      logTransactions: [SettingsDefault.logTransactions],
      envVarsPrefix: [SettingsDefault.envVarsPrefix],
      enableRandomLatency: [SettingsDefault.enableRandomLatency],
      displayLogsIsoTimestamp: [SettingsDefault.displayLogsIsoTimestamp]
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
        takeUntilDestroyed()
      )
      .subscribe();

    // subscribe to active environment changes to reset the form
    this.settings$
      .pipe(
        tap((settings) => {
          this.settingsForm.setValue(
            {
              truncateRouteName: settings.truncateRouteName,
              maxLogsPerEnvironment: settings.maxLogsPerEnvironment,
              fakerLocale: settings.fakerLocale,
              fakerSeed: settings.fakerSeed,
              fileWatcherEnabled: settings.fileWatcherEnabled,
              storagePrettyPrint: settings.storagePrettyPrint,
              enableTelemetry: settings.enableTelemetry,
              startEnvironmentsOnLoad: settings.startEnvironmentsOnLoad,
              logTransactions: settings.logTransactions,
              envVarsPrefix: settings.envVarsPrefix,
              enableRandomLatency: settings.enableRandomLatency,
              displayLogsIsoTimestamp: settings.displayLogsIsoTimestamp
            },
            { emitEvent: false }
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe();
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

  public close() {
    this.uiService.closeModal('settings');
  }
}
