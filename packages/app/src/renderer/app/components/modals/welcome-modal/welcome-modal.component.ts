import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { TourService } from 'src/renderer/app/services/tour.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-welcome-modal',
  templateUrl: './welcome-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SvgComponent]
})
export class WelcomeModalComponent {
  private settingsService = inject(SettingsService);
  private uiService = inject(UIService);
  private tourService = inject(TourService);
  private userService = inject(UserService);

  public isWeb = Config.isWeb;

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
