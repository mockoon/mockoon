import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { Environment, Route } from '@mockoon/commons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { DuplicateRouteToAnotherEnvironment } from 'src/renderer/app/models/store.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { finalizeRouteDuplicationToAnotherEnvironmentAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-duplicate-route-modal',
  templateUrl: './duplicate-route-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DuplicateRouteModalComponent implements OnDestroy, AfterViewInit {
  @ViewChild('modal')
  public modal: ElementRef;
  public environments$: Observable<Environment[]> = this.store
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
    this.modalService.open(this.modal);
  }

  private extractRouteToDuplicate(state: DuplicateRouteToAnotherEnvironment) {
    this.routeToDuplicate = this.activeEnvironment.routes.find(
      (route: Route) => route.uuid === state.routeUUID
    );
  }
}
