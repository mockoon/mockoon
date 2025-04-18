import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit
} from '@angular/core';
import { Plans } from '@mockoon/cloud';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Observable, from, map } from 'rxjs';
import { SpinnerComponent } from 'src/renderer/app/components/spinner.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import {
  TemplatesTabsName,
  UIState
} from 'src/renderer/app/models/store.model';
import { EventsService } from 'src/renderer/app/services/events.service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { TemplatesService } from 'src/renderer/app/services/templates.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { setActiveTemplatesTabAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgbTooltip, SvgComponent, AsyncPipe, SpinnerComponent]
})
export class FooterComponent implements OnInit {
  @Input() public isTemplateModalOpen: boolean;
  @Input() public isTemplateLoading: boolean;
  public updateAvailable$: BehaviorSubject<string | null>;
  public platform$ = from(this.mainApiService.invoke('APP_GET_OS'));
  public uiState$: Observable<UIState>;
  public generatingTemplate$ = this.templateService.generatingTemplate$;
  public generatingEndpoint$ = this.templateService.generatingEndpoint$;
  public releaseUrl = Config.releasePublicURL;
  public showFeedback$ = this.store
    .select('user')
    .pipe(map((user) => !!user && user.plan !== Plans.FREE));

  constructor(
    private store: Store,
    private eventsService: EventsService,
    private uiService: UIService,
    private templateService: TemplatesService,
    private mainApiService: MainApiService
  ) {}

  ngOnInit() {
    this.updateAvailable$ = this.eventsService.updateAvailable$;
    this.uiState$ = this.store.select('uiState');
  }

  /**
   * Apply the update
   */
  public applyUpdate() {
    this.mainApiService.send('APP_APPLY_UPDATE');
  }

  public openTemplateModal(tab: TemplatesTabsName) {
    this.store.update(setActiveTemplatesTabAction(tab));
    this.uiService.openModal('templates');
  }

  public openFeedbackModal() {
    this.uiService.openModal('feedback');
  }
}
