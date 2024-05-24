import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit
} from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import {
  TemplatesTabsName,
  UIState
} from 'src/renderer/app/models/store.model';
import { EventsService } from 'src/renderer/app/services/events.service';
import { TemplatesService } from 'src/renderer/app/services/templates.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { setActiveTemplatesTabAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnInit {
  @Input() public isTemplateModalOpen: boolean;
  @Input() public isTemplateLoading: boolean;
  public updateAvailable$: BehaviorSubject<string | null>;
  public platform$ = from(MainAPI.invoke('APP_GET_PLATFORM'));
  public uiState$: Observable<UIState>;
  public generatingTemplate$ = this.templateService.generatingTemplate$;
  public generatingEndpoint$ = this.templateService.generatingEndpoint$;
  public releaseUrl = Config.releasePublicURL;

  constructor(
    private store: Store,
    private eventsService: EventsService,
    private uiService: UIService,
    private templateService: TemplatesService
  ) {}

  ngOnInit() {
    this.updateAvailable$ = this.eventsService.updateAvailable$;
    this.uiState$ = this.store.select('uiState');
  }

  /**
   * Apply the update
   */
  public applyUpdate() {
    MainAPI.send('APP_APPLY_UPDATE');
  }

  public openTemplateModal(tab: TemplatesTabsName) {
    this.store.update(setActiveTemplatesTabAction(tab));
    this.uiService.openModal('templates');
  }
}
