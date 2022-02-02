import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subscription } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { ConfirmModalEvent } from 'src/renderer/app/models/ui.model';
import { EventsService } from 'src/renderer/app/services/events.service';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('modal')
  public modal: NgbModal;
  public confirmModalEvent$: Observable<ConfirmModalEvent>;
  private confirmModalEventSub: Subscription;

  constructor(
    private modalService: NgbModal,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.confirmModalEvent$ = this.eventsService.confirmModalEvents;
  }

  ngAfterViewInit() {
    this.confirmModalEventSub = this.confirmModalEvent$
      .pipe(
        filter((confirmModalEvent) => !!confirmModalEvent),
        tap((confirmModalEvent) => {
          this.modalService
            .open(this.modal, {
              size: 'sm'
            })
            .result.then(() => {
              confirmModalEvent.confirmed$.next();
            });
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.confirmModalEventSub.unsubscribe();
  }
}
