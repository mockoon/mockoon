import { Component, inject } from '@angular/core';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-welcome-modal',
  templateUrl: './welcome-modal.component.html'
})
export class WelcomeModalComponent {
  private settingsService = inject(SettingsService);
  private uiService = inject(UIService);
  private userService = inject(UserService);

  public isWeb = Config.isWeb;

  public close() {
    this.uiService.closeModal('welcome');
    this.settingsService.updateSettings({ welcomeShown: true });

    if (this.isWeb) {
      this.userService.webAuthHandler().subscribe();
    }
  }
}
