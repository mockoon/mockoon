import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CORSHeaders, Environment, Header } from '@mockoon/commons';
import { Observable } from 'rxjs';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-environment-headers',
  templateUrl: './environment-headers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnvironmentHeadersComponent implements OnInit {
  public activeEnvironment$: Observable<Environment>;
  public scrollToBottom = this.uiService.scrollToBottom;

  constructor(
    private uiService: UIService,
    private store: Store,
    private eventsService: EventsService,
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
    this.eventsService.injectHeaders$.next({
      dataSubject: 'environment',
      headers: CORSHeaders
    });
  }
}
