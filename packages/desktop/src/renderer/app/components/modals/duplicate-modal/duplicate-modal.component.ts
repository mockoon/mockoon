import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { DataBucket, Environment, Route } from '@mockoon/commons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataSubject } from 'src/renderer/app/models/data.model';
import { DuplicateEntityToAnotherEnvironment } from 'src/renderer/app/models/store.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { finalizeEntityDuplicationToAnotherEnvironmentAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-duplicate-modal',
  templateUrl: './duplicate-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DuplicateModalComponent implements OnDestroy, AfterViewInit {
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
  public entityInformation: {
    displayName: string;
    subject: Omit<DataSubject, 'environment'>;
    uuid: string;
  } = {
    displayName: '',
    subject: '',
    uuid: ''
  };

  private entityDuplicationState$ = this.store.select(
    'duplicateEntityToAnotherEnvironment'
  );

  private entityDuplicationSubscription: Subscription;

  constructor(
    private modalService: NgbModal,
    private store: Store,
    private environmentsService: EnvironmentsService
  ) {}

  private get activeEnvironment() {
    return this.store.getActiveEnvironment();
  }

  ngAfterViewInit() {
    this.entityDuplicationSubscription = this.entityDuplicationState$.subscribe(
      (state: DuplicateEntityToAnotherEnvironment) => {
        if (state.moving) {
          this.extractEntityToDuplicate(state);
          this.openModal();
        }
      }
    );
  }

  ngOnDestroy() {
    this.entityDuplicationSubscription.unsubscribe();
  }

  public closeModal() {
    this.store.update(finalizeEntityDuplicationToAnotherEnvironmentAction());
    this.modalService.dismissAll(false);
  }

  public chooseTargetEnvironment(
    targetEnvironment: Environment,
    entityInformation: {
      displayName: string;
      subject: Omit<DataSubject, 'environment'>;
      uuid: string;
    }
  ) {
    if (entityInformation.subject === 'route') {
      this.environmentsService.duplicateRouteInAnotherEnvironment(
        this.entityInformation.uuid,
        targetEnvironment.uuid
      );
    } else if (entityInformation.subject === 'databucket') {
      this.environmentsService.duplicateDatabucketInAnotherEnvironment(
        this.entityInformation.uuid,
        targetEnvironment.uuid
      );
    }
    this.closeModal();
  }

  private openModal() {
    this.modalService.open(this.modal);
  }

  private extractEntityToDuplicate(state: DuplicateEntityToAnotherEnvironment) {
    if (state.subject === 'route') {
      const entityToDuplicate = this.activeEnvironment.routes.find(
        (route: Route) => route.uuid === state.subjectUUID
      );
      this.entityInformation = {
        displayName: `${entityToDuplicate.method.toUpperCase()} /${
          entityToDuplicate.endpoint
        }`,
        subject: state.subject,
        uuid: entityToDuplicate.uuid
      };
    } else if (state.subject === 'databucket') {
      const entityToDuplicate = this.activeEnvironment.data.find(
        (databucket: DataBucket) => databucket.uuid === state.subjectUUID
      );
      this.entityInformation = {
        displayName: entityToDuplicate.name,
        subject: state.subject,
        uuid: entityToDuplicate.uuid
      };
    }
  }
}
