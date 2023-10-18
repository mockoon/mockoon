import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { ConfirmModalPayload } from 'src/renderer/app/models/ui.model';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UIService } from 'src/renderer/app/services/ui.service';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmModalComponent implements OnInit, OnDestroy {
  public confirmModalPayload$: Observable<ConfirmModalPayload>;
  private destroy$ = new Subject<void>();

  constructor(
    private uiService: UIService,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.confirmModalPayload$ = this.eventsService.confirmModalPayload$.pipe(
      tap((confirmModalPayload) => {
        this.uiService
          .getModalInstance('confirm')
          .result.then(() => {
            // confirm was validated
            confirmModalPayload.confirmed$.next(true);
          })
          .catch(() => {
            // confirm was closed
            confirmModalPayload.confirmed$.next(false);
          });
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public close() {
    this.uiService.closeModal('confirm');
  }

  public dismiss() {
    this.uiService.dismissModal('confirm');
  }
}
