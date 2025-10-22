import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { ConfirmModalPayload } from 'src/renderer/app/models/ui.model';
import { UIService } from 'src/renderer/app/services/ui.service';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, SvgComponent, AsyncPipe]
})
export class ConfirmModalComponent implements OnInit, OnDestroy {
  private uiService = inject(UIService);

  public confirmModalPayload$: Observable<ConfirmModalPayload>;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.confirmModalPayload$ = this.uiService.getModalPayload$('confirm').pipe(
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
