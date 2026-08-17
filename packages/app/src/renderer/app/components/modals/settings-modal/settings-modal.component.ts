import { Component, effect, inject, signal } from '@angular/core';
import {
  debounce,
  form,
  FormField,
  validateHttp
} from '@angular/forms/signals';
import { IsEqual } from '@mockoon/commons';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
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
import { SelectComponent } from '../../custom-form-elements/select.component';
import { SpinnerComponent } from '../../spinner.component';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['settings-modal.component.scss'],
  imports: [
    TitleSeparatorComponent,
    SvgComponent,
    NgbTooltip,
    InputNumberDirective,
    SelectComponent,
    FormField,
    SpinnerComponent
  ]
})
export class SettingsModalComponent {
  private settingsService = inject(SettingsService);
  private store = inject(Store);
  private uiService = inject(UIService);
  private settings = this.store.selectSignal('settings');
  public Infinity = Infinity;
  public fakerLocales: DropdownItems = FakerLocales;
  public fileWatcherOptions: DropdownItems = [
    { value: FileWatcherOptions.DISABLED, label: 'Disabled' },
    { value: FileWatcherOptions.PROMPT, label: 'Prompt' },
    { value: FileWatcherOptions.AUTO, label: 'Auto' }
  ];

  public isWeb = Config.isWeb;
  public maxLogsPerEnvironmentLimit = Config.maxLogsPerEnvironmentLimit;
  private validatedApiUrls = new Set<string>();
  public settingsForm = form(
    signal<Settings>(SettingsDefault),
    (schemaPath) => {
      debounce(schemaPath, 300);

      validateHttp(schemaPath.apiUrl, {
        request: ({ value }) => {
          const apiUrl = value();

          if (this.validatedApiUrls.has(apiUrl) || !apiUrl) {
            return undefined;
          }

          // only validate the URL if it is valid
          new URL(apiUrl);

          return `${apiUrl}/health`;
        },
        onSuccess: (response: { status: 'ok' }, { value }) => {
          if (response.status === 'ok') {
            this.validatedApiUrls.add(value());

            return null;
          }

          return {
            kind: 'invalidApiUrl',
            message:
              'Self-hosted API URL is invalid. Please check the URL and try again.'
          };
        },
        onError: () => ({
          kind: 'invalidApiUrl',
          message:
            'Self-hosted API URL is invalid. Please check the URL and try again.'
        })
      });
    }
  );

  constructor() {
    effect(() => {
      if (this.settingsForm().dirty()) {
        this.settingsService.updateSettings(this.settingsForm().value());
      }

      if (!IsEqual(this.settingsForm().value(), this.settings())) {
        this.settingsForm().reset(this.settings());
      }
    });
  }

  public close() {
    this.uiService.closeModal('settings');
  }
}
