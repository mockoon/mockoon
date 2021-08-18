import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { pluck } from 'rxjs/operators';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { EventsService } from 'src/renderer/app/services/events.service';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent implements OnInit {
  public updateAvailable$: BehaviorSubject<boolean>;
  public platform$ = from(MainAPI.invoke('APP_GET_PLATFORM'));
  public closing$: Observable<boolean>;

  constructor(private store: Store, private eventsService: EventsService) {}

  ngOnInit() {
    this.updateAvailable$ = this.eventsService.updateAvailable$;
    this.closing$ = this.store.select('uiState').pipe(pluck('closing'));
  }

  /**
   * Apply the update
   */
  public applyUpdate() {
    MainAPI.send('APP_APPLY_UPDATE');
  }
}
