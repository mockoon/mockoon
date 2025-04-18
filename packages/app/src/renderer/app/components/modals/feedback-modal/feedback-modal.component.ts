import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, tap } from 'rxjs';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { upateFeedbackAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-feedback-modal',
  templateUrl: './feedback-modal.component.html',
  styleUrls: ['./feedback-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, SvgComponent, AsyncPipe]
})
export class FeedbackModalComponent {
  public feedbackControl = new FormControl<string>('', [
    Validators.required,
    Validators.maxLength(10000),
    Validators.minLength(10)
  ]);
  public userEmail$ = this.store
    .select('user')
    .pipe(map((user) => user?.email));
  public userPlan$ = this.store.select('user').pipe(map((user) => user?.plan));

  constructor(
    private uiService: UIService,
    private store: Store,
    private userService: UserService
  ) {
    this.feedbackControl.setValue(this.store.get('feedback'));

    this.feedbackControl.valueChanges
      .pipe(
        takeUntilDestroyed(),
        tap((feedback) => {
          this.store.update(upateFeedbackAction(feedback));
        })
      )
      .subscribe();
  }

  public send() {
    this.userService
      .sendFeedback(this.feedbackControl.value)
      .pipe(
        tap(() => {
          this.close();
        })
      )
      .subscribe();
  }

  public close() {
    this.uiService.closeModal('feedback');
  }
}
