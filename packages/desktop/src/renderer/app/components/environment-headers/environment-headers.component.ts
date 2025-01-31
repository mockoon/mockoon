import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CORSHeaders, Environment, Header } from '@mockoon/commons';
import { Observable } from 'rxjs';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { updateEnvironmentAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-environment-headers',
  templateUrl: './environment-headers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class EnvironmentHeadersComponent implements OnInit {
  public activeEnvironment$: Observable<Environment>;
  public scrollToBottom = this.uiService.scrollToBottom;

  constructor(
    private uiService: UIService,
    private store: Store,
    private environmentsService: EnvironmentsService
  ) {}

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
  }

  /**
   * Update the store when headers list is updated
   */
  public headersUpdated(headers: Header[]) {
    this.environmentsService.updateActiveEnvironment({
      headers
    });
  }

  /**
   * Inject the CORS headers in the environment headers list
   */
  public addCORSHeaders() {
    const activeEnvironment = this.store.getActiveEnvironment();
    const newHeaders = [...activeEnvironment.headers];
    let headersChanged = false;

    CORSHeaders.forEach((corsHeader) => {
      const headerExistsIndex = newHeaders.findIndex(
        (newHeader) => newHeader.key === corsHeader.key
      );

      if (headerExistsIndex > -1 && !newHeaders[headerExistsIndex].value) {
        newHeaders[headerExistsIndex] = { ...corsHeader };
        headersChanged = true;
      } else if (headerExistsIndex === -1) {
        newHeaders.push({ ...corsHeader });
        headersChanged = true;
      }
    });

    if (headersChanged) {
      this.store.update(
        updateEnvironmentAction(activeEnvironment.uuid, {
          headers: newHeaders
        }),
        // force as it is a non-UI change
        true
      );
    }
  }
}
