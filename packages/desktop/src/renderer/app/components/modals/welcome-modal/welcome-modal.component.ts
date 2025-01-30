import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { TourService } from 'src/renderer/app/services/tour.service';
import { UIService } from 'src/renderer/app/services/ui.service';

@Component({
  selector: 'app-welcome-modal',
  templateUrl: './welcome-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class WelcomeModalComponent {
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
