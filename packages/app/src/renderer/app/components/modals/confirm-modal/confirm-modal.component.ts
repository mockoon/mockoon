import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { ConfirmModalPayload } from 'src/renderer/app/models/ui.model';
import { UIService } from 'src/renderer/app/services/ui.service';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, SvgComponent, AsyncPipe]
})
export class ConfirmModalComponent {
  private uiService = inject(UIService);
  public confirmModalPayload$: Observable<ConfirmModalPayload>;

  constructor() {
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
      takeUntilDestroyed()
    );
  }

  public close() {
    this.uiService.closeModal('confirm');
  }

  public dismiss() {
    this.uiService.dismissModal('confirm');
  }
}
