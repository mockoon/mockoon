import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { TourService } from 'src/renderer/app/services/tour.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { environment as env } from 'src/renderer/environments/environment';

@Component({
  selector: 'app-welcome-modal',
  templateUrl: './welcome-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomeModalComponent {
  public isWeb = env.web;

  constructor(
    private settingsService: SettingsService,
    private uiService: UIService,
    private tourService: TourService,
    private userService: UserService
  ) {}

  public close(takeTour: boolean) {
    this.uiService.closeModal('welcome');
    this.settingsService.updateSettings({ welcomeShown: true });

    if (this.isWeb) {
      this.userService.webAuthHandler().subscribe();
    }

    // currently disabled on web
    if (takeTour) {
      this.tourService.start();
    }
  }
}
