import {
  ChangeDetectionStrategy,
  Component,
  HostListener
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { SpinnerComponent } from 'src/renderer/app/components/spinner.component';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-auth-iframe-modal',
  templateUrl: './auth-iframe-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, SpinnerComponent],
  host: { class: 'position-relative' }
})
export class AuthIframeModalComponent {
  public appAuthURL = this.domSanitizer.bypassSecurityTrustResourceUrl(
    `${Config.appAuthURL}?webapp=true`
  );
  public displaySpinner = true;

  constructor(
    private domSanitizer: DomSanitizer,
    private userService: UserService,
    private uiService: UIService
  ) {}

  @HostListener('window:message', ['$event'])
  private onMessage(event: MessageEvent) {
    if (event.origin === Config.websiteURL.replace(/\/$/, '')) {
      if (event.data.includes('token=')) {
        const token = event.data.split('token=')[1];

        if (!token) {
          return;
        }

        this.userService.webAuthCallbackHandler(token).subscribe();
        this.uiService.closeModal('authIframe');
      } else if (event.data === 'loaded') {
        this.displaySpinner = false;
      }
    }
  }
}
