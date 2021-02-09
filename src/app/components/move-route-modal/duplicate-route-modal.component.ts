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
import { map } from 'rxjs/operators';
import { methods } from '../../constants/routes.constants';
import { EnvironmentsService } from '../../services/environments.service';
import { finalizeRouteDuplicationToAnotherEnvironmentAction } from '../../stores/actions';
import { DuplicateRouteToAnotherEnvironment, Store } from '../../stores/store';

@Component({
  selector: 'app-duplicate-route-modal',
  templateUrl: './duplicate-route-modal.component.html',
  styleUrls: ['./duplicate-route-modal.component.scss']
})
export class DuplicateRouteModalComponent implements OnDestroy, AfterViewInit {
  @ViewChild('modal', { static: false })
  public modal: ElementRef;
  public environments$ = this.store
    .select('environments')
    .pipe(
      map((environments: Environment[]) =>
        environments.filter((environment: Environment) =>
          this.activeEnvironment
            ? this.activeEnvironment.uuid !== environment.uuid
            : true
        )
      )
    );
  public routeToDuplicate: Route;
  public methods = methods;

  private routeDuplicationState$ = this.store.select(
    'duplicateRouteToAnotherEnvironment'
  );

  private routeDuplicationSubscription: Subscription;

  private get activeEnvironment() {
    return this.store.getActiveEnvironment();
  }

  constructor(
    private modalService: NgbModal,
    private store: Store,
    private environmentsService: EnvironmentsService
  ) {}

  ngAfterViewInit() {
    this.routeDuplicationSubscription = this.routeDuplicationState$.subscribe(
      (state: DuplicateRouteToAnotherEnvironment) => {
        if (state.moving) {
          this.extractRouteToDuplicate(state);
          this.openModal();
        }
      }
    );
  }

  ngOnDestroy() {
    this.routeDuplicationSubscription.unsubscribe();
  }

  public closeModal() {
    this.store.update(finalizeRouteDuplicationToAnotherEnvironmentAction());
    this.modalService.dismissAll(false);
  }

  public chooseTargetEnvironment(targetEnvironment: Environment) {
    this.environmentsService.duplicateRouteInAnotherEnvironment(
      this.routeToDuplicate.uuid,
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

  private extractRouteToDuplicate(state: DuplicateRouteToAnotherEnvironment) {
    this.routeToDuplicate = this.activeEnvironment.routes.find(
      (route: Route) => route.uuid === state.routeUUID
    );
  }
}
