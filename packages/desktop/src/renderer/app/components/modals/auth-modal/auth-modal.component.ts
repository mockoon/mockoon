import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import {
  BehaviorSubject,
  catchError,
  delay,
  EMPTY,
  filter,
  mergeMap,
  tap
} from 'rxjs';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthModalComponent implements OnInit, AfterViewInit {
  @ViewChild('modal')
  public modal: ElementRef;
  public loginURL = Config.loginURL;
  public isLoading$ = new BehaviorSubject<boolean>(false);
  public isSuccess$ = new BehaviorSubject<boolean>(false);
  public tokenControl = new FormControl('');
  private modalInstance: NgbModalRef;

  constructor(
    private modalService: NgbModal,
    private eventsService: EventsService,
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
          this.closeModal();
        })
      )
      .subscribe();
  }

  ngAfterViewInit() {
    this.eventsService.authModalEvents
      .pipe(
        tap(() => {
          this.modalInstance = this.modalService.open(this.modal, {
            size: 'md'
          });
        })
      )
      .subscribe();
  }

  public closeModal() {
    this.isLoading$.next(false);
    this.isSuccess$.next(false);
    this.tokenControl.reset();

    if (this.modalInstance) {
      this.modalInstance.close();
    }
  }
}
