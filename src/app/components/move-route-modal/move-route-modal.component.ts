import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MoveRouteToAnotherEnvironment, Store } from '../../stores/store';

@Component({
  selector: 'app-move-route-modal',
  templateUrl: './move-route-modal.component.html',
  styleUrls: ['./move-route-modal.component.scss']
})
export class MoveRouteModalComponent implements OnDestroy, AfterViewInit {
  @ViewChild('modal', { static: false })
  public modal: ElementRef;

  private routeMovementState$ = this.store.select(
    'moveRouteToAnotherEnvironment'
  );

  private routeMovementSubscription: Subscription;

  constructor(private modalService: NgbModal, private store: Store) {}

  ngAfterViewInit() {
    this.routeMovementSubscription = this.routeMovementState$
      .pipe(
        tap((state: MoveRouteToAnotherEnvironment) => {
          if (state.moving) {
            this.modalService.open(this.modal, {
              backdrop: 'static',
              centered: true
            });
          }
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.routeMovementSubscription.unsubscribe();
  }
}
