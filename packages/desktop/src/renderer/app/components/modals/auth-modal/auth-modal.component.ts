import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import {
  BehaviorSubject,
  EMPTY,
  Subject,
  catchError,
  delay,
  filter,
  mergeMap,
  takeUntil,
  tap
} from 'rxjs';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthModalComponent implements OnInit, OnDestroy {
  public loginURL = Config.loginURL;
  public isLoading$ = new BehaviorSubject<boolean>(false);
  public isSuccess$ = new BehaviorSubject<boolean>(false);
  public tokenControl = new UntypedFormControl('');
  private destroy$ = new Subject<void>();

  constructor(
    private uiService: UIService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.tokenControl.valueChanges
      .pipe(
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
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public close() {
    this.isLoading$.next(false);
    this.isSuccess$.next(false);
    this.tokenControl.reset();

    this.uiService.closeModal('auth');
  }
}
