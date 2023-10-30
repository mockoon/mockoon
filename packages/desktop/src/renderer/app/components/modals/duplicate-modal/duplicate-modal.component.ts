import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Callback, DataBucket, Environment, Route } from '@mockoon/commons';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataSubject } from 'src/renderer/app/models/data.model';
import { DuplicateEntityToAnotherEnvironment } from 'src/renderer/app/models/store.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { cancelEntityDuplicationToAnotherEnvironmentAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-duplicate-modal',
  templateUrl: './duplicate-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DuplicateModalComponent implements OnInit, OnDestroy {
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
    private uiService: UIService,
    private store: Store,
    private environmentsService: EnvironmentsService
  ) {}

  private get activeEnvironment() {
    return this.store.getActiveEnvironment();
  }

  ngOnInit() {
    this.entityDuplicationSubscription = this.entityDuplicationState$.subscribe(
      (state: DuplicateEntityToAnotherEnvironment) => {
        if (state.moving) {
          this.extractEntityToDuplicate(state);
        }
      }
    );
  }

  ngOnDestroy() {
    this.entityDuplicationSubscription.unsubscribe();
  }

  public close() {
    this.uiService.closeModal('duplicate_to_environment', false);
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
    } else if (entityInformation.subject === 'callback') {
      this.environmentsService.duplicateCallbackInAnotherEnvironment(
        this.entityInformation.uuid,
        targetEnvironment.uuid
      );
    }

    this.store.update(cancelEntityDuplicationToAnotherEnvironmentAction());
    this.uiService.closeModal('duplicate_to_environment');
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
    } else if (state.subject === 'callback') {
      const entityToDuplicate = this.activeEnvironment.callbacks.find(
        (cb: Callback) => cb.uuid === state.subjectUUID
      );
      this.entityInformation = {
        displayName: entityToDuplicate.name,
        subject: state.subject,
        uuid: entityToDuplicate.uuid
      };
    }
  }
}
