import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { Environment, Route } from '@mockoon/commons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { methods } from '../../constants/routes.constants';
import { EnvironmentsService } from '../../services/environments.service';
import { finalizeRouteMovementToAnotherEnvironmentAction } from '../../stores/actions';
import { MoveRouteToAnotherEnvironment, Store } from '../../stores/store';

@Component({
  selector: 'app-move-route-modal',
  templateUrl: './move-route-modal.component.html',
  styleUrls: ['./move-route-modal.component.scss']
})
export class MoveRouteModalComponent implements OnDestroy, AfterViewInit {
  @ViewChild('modal', { static: false })
  public modal: ElementRef;
  public environments$ = this.store.select('environments').pipe(
    map((environments: Environment[]) =>
      environments.filter((environment: Environment) =>
        this.activeEnvironment
          ? this.activeEnvironment.uuid !== environment.uuid
          : true)
    )
  );
  public routeToMove: Route;
  public methods = methods;

  private routeMovementState$ = this.store.select(
    'moveRouteToAnotherEnvironment'
  );

  private routeMovementSubscription: Subscription;

  private get activeEnvironment() {
    return this.store.getActiveEnvironment();
  }

  constructor(
    private modalService: NgbModal,
    private store: Store,
    private environmentsService: EnvironmentsService
  ) {
  }

  ngAfterViewInit() {
    this.routeMovementSubscription = this.routeMovementState$
      .pipe(
        tap((state: MoveRouteToAnotherEnvironment) => {
          if (state.moving) {
            this.extractRouteToMove(state);
            this.openModal();
          }
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.routeMovementSubscription.unsubscribe();
  }

  public closeModal() {
    this.store.update(finalizeRouteMovementToAnotherEnvironmentAction());
    this.modalService.dismissAll(false);
  }

  public chooseTargetEnvironment(targetEnvironment: Environment) {
    this.environmentsService.duplicateRouteInAnotherEnvironment(
      this.routeToMove.uuid,
      targetEnvironment.uuid
    );
    this.closeModal();
  }

  private openModal() {
    this.modalService.open(this.modal, {
      backdrop: 'static',
      centered: true
    });
  }

  private extractRouteToMove(state: MoveRouteToAnotherEnvironment) {
    this.routeToMove = this.activeEnvironment.routes.find(
      (route: Route) => route.uuid === state.routeUUID
    );
  }
}
