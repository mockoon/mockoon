import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { UIService } from 'src/renderer/app/services/ui.service';

@Component({
  selector: 'app-welcome-modal',
  templateUrl: './welcome-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomeModalComponent {
  constructor(
    private settingsService: SettingsService,
    private uiservice: UIService
  ) {}

  public close() {
    this.uiservice.closeModal('welcome');
    this.settingsService.updateSettings({ welcomeShown: true });
  }
}
