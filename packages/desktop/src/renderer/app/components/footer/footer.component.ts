import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit
} from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { UIState } from 'src/renderer/app/models/store.model';
import { EventsService } from 'src/renderer/app/services/events.service';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnInit {
  @Input() public isTemplateModalOpen: boolean;
  @Input() public isTemplateLoading: boolean;
  public updateAvailable$: BehaviorSubject<boolean>;
  public platform$ = from(MainAPI.invoke('APP_GET_PLATFORM'));
  public uiState$: Observable<UIState>;
  public generatingTemplate$ = this.eventsService.generatingTemplate$;

  constructor(private store: Store, private eventsService: EventsService) {}

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

  public openTemplateModal() {
    this.eventsService.templatesModalEvents.next();
  }
}
