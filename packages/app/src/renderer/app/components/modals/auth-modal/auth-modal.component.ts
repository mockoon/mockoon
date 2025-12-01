import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormControl
} from '@angular/forms';
import {
  BehaviorSubject,
  EMPTY,
  catchError,
  debounceTime,
  delay,
  filter,
  mergeMap,
  tap
} from 'rxjs';
import { SpinnerComponent } from 'src/renderer/app/components/spinner.component';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, AsyncPipe, SpinnerComponent]
})
export class AuthModalComponent {
  private uiService = inject(UIService);
  private userService = inject(UserService);
  public isLoading$ = new BehaviorSubject<boolean>(false);
  public isSuccess$ = new BehaviorSubject<boolean>(false);
  public tokenControl = new UntypedFormControl('');

  constructor() {
    this.tokenControl.valueChanges
      .pipe(
        debounceTime(500),
        filter((token) => !!token),
        tap(() => {
          this.tokenControl.setErrors(null);
          this.isLoading$.next(true);
        }),
        mergeMap((token) =>
          this.userService.authWithToken(token).pipe(
            catchError(() => {
              this.tokenControl.setErrors({ invalid: true });
              this.isLoading$.next(false);

              return EMPTY;
            })
          )
        ),
        tap(() => {
          this.isLoading$.next(false);
          this.isSuccess$.next(true);
        }),
        delay(2000),
        tap(() => {
          this.close();
        }),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  public close() {
    this.isLoading$.next(false);
    this.isSuccess$.next(false);
    this.tokenControl.reset();

    this.uiService.closeModal('auth');
  }
}
