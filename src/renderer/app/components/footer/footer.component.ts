import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';
import { EventsService } from 'src/renderer/app/services/events.service';
import { Store } from 'src/renderer/app/stores/store';
import { MainAPI } from 'src/renderer/app/constants/common.constants';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnInit {
  public updateAvailable$: BehaviorSubject<boolean>;
  public platform$ = from(MainAPI.invoke('APP_GET_PLATFORM'));
  public appClosing$: Observable<boolean>;

  constructor(private store: Store, private eventsService: EventsService) {}

  ngOnInit() {
    this.updateAvailable$ = this.eventsService.updateAvailable$;
    this.appClosing$ = this.store.select('uiState').pipe(pluck('appClosing'));
  }

  /**
   * Apply the update
   */
  public applyUpdate() {
    MainAPI.send('APP_APPLY_UPDATE');
  }
}
