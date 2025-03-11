import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { TourService } from 'src/renderer/app/services/tour.service';
import { UIService } from 'src/renderer/app/services/ui.service';
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
    private uiservice: UIService,
    private tourService: TourService
  ) {}

  public close(takeTour: boolean) {
    this.uiservice.closeModal('welcome');
    this.settingsService.updateSettings({ welcomeShown: true });

    if (takeTour) {
      this.tourService.start();
    }
  }
}
