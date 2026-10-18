import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { EnvironmentSourceService } from 'src/renderer/app/services/environment-source.service';
import { UIService } from 'src/renderer/app/services/ui.service';

const httpUrlValidator = (
  control: AbstractControl
): ValidationErrors | null => {
  try {
    const parsed = new URL(control.value);

    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? null
      : { invalidUrl: true };
  } catch {
    return { invalidUrl: true };
  }
};

@Component({
  selector: 'app-environment-url-modal',
  templateUrl: './environment-url-modal.component.html',
  imports: [ReactiveFormsModule]
})
export class EnvironmentUrlModalComponent {
  private uiService = inject(UIService);
  private environmentSourceService = inject(EnvironmentSourceService);

  public url = new FormControl<string>('', {
    validators: [Validators.required, httpUrlValidator]
  });

  public close() {
    this.uiService.closeModal('environmentUrl');
  }

  public submit() {
    if (this.url.invalid) {
      return;
    }

    this.environmentSourceService
      .newEnvironmentFromURL(this.url.value)
      .subscribe();
    this.uiService.closeModal('environmentUrl');
  }
}
