import { Component, inject } from '@angular/core';
import { SettingsModalComponent } from 'src/renderer/app/components/modals/settings-modal/settings-modal.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-connection-modal',
  templateUrl: './connection-modal.component.html',
  styleUrls: ['./connection-modal.component.scss'],
  imports: [SvgComponent]
})
export class ConnectionModalComponent {
  private uiService = inject(UIService);
  private userService = inject(UserService);
  public proPlansURL = Config.proPlansURL;

  public configureSelfHosted() {
    this.uiService.openModal('settings');
    const settingsModal = this.uiService.getModalInstance('settings')
      .componentInstance as SettingsModalComponent;

    settingsModal.highlightSelfHostedSection();
  }

  public connectLegacyCloud() {
    this.uiService.closeModal('connection');
    this.userService.startLegacyCloudLoginFlow();
  }

  public close() {
    this.uiService.closeModal('connection');
  }
}
