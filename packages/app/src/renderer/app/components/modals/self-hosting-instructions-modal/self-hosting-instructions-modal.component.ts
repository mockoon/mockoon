import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-self-hosting-instructions-modal',
  templateUrl: './self-hosting-instructions-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SvgComponent, AsyncPipe, NgbTooltip]
})
export class SelfHostingInstructionsModalComponent {
  private uiService = inject(UIService);
  private mainApiService = inject(MainApiService);
  private store = inject(Store);

  public accountAuthenticationUrl = Config.accountAuthenticationUrl;
  public cloudDeployCliPull = Config.docs.cloudDeployCliPull;
  public environmentUuid$ = this.uiService.getModalPayload$(
    'selfHostingInstructions'
  );
  public environment$ = this.environmentUuid$.pipe(
    map((uuid) => this.store.getEnvironmentByUUID(uuid))
  );
  public cliCommand$: Observable<string> = this.environmentUuid$.pipe(
    map(
      (uuid) => `mockoon-cli start --data cloud://${uuid} --token <YOUR_TOKEN>`
    )
  );

  public close() {
    this.uiService.closeModal('selfHostingInstructions');
  }

  public copy(text: string) {
    this.mainApiService.send('APP_WRITE_CLIPBOARD', text);
  }
}
