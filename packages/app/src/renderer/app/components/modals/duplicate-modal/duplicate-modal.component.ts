import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Callback, DataBucket, Environment, Route } from '@mockoon/commons';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DataSubject } from 'src/renderer/app/models/data.model';
import { DuplicateEntityToAnotherEnvironment } from 'src/renderer/app/models/store.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { cancelEntityDuplicationToAnotherEnvironmentAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-duplicate-modal',
  templateUrl: './duplicate-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe]
})
export class DuplicateModalComponent implements OnInit, OnDestroy {
  private uiService = inject(UIService);
  private store = inject(Store);
  private environmentsService = inject(EnvironmentsService);
  public environments$: Observable<Environment[]> = combineLatest([
    this.store.select('activeEnvironmentUUID').pipe(filter((uuid) => !!uuid)),
    this.store
      .select('environments')
      .pipe(filter((environments) => !!environments)),
    this.store.select('settings').pipe(
      filter((settings) => !!settings),
      map((settings) => settings.environments)
    ),
    this.store.selectIsCloudEditable()
  ]).pipe(
    map(
      ([
        activeEnvironmentUuid,
        environments,
        envDescriptors,
        isCloudEditable
      ]) =>
        // exclude source environment, and cloud envs if not editable
        environments.filter(
          (environment: Environment) =>
            environment.uuid !== activeEnvironmentUuid &&
            !envDescriptors.find(
              (envDescriptor) =>
                envDescriptor.uuid === environment.uuid &&
                envDescriptor.cloud &&
                !isCloudEditable
            )
        )
    )
  );
  public entityInformation: {
    displayName: string;
    subject: Omit<DataSubject, 'environment'>;
    uuids: string[];
  } = {
    displayName: '',
    subject: '',
    uuids: []
  };

  private entityDuplicationState$ = this.store.select(
    'duplicateEntityToAnotherEnvironment'
  );

  private entityDuplicationSubscription: Subscription;

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
      uuids: string[];
    }
  ) {
    for (const uuid of entityInformation.uuids) {
      if (entityInformation.subject === 'route') {
        this.environmentsService.duplicateRouteInAnotherEnvironment(
          uuid,
          targetEnvironment.uuid
        );
      } else if (entityInformation.subject === 'databucket') {
        this.environmentsService.duplicateDatabucketInAnotherEnvironment(
          uuid,
          targetEnvironment.uuid
        );
      } else if (entityInformation.subject === 'callback') {
        this.environmentsService.duplicateCallbackInAnotherEnvironment(
          uuid,
          targetEnvironment.uuid
        );
      }
    }

    this.store.update(cancelEntityDuplicationToAnotherEnvironmentAction());
    this.uiService.closeModal('duplicate_to_environment');
  }

  private extractEntityToDuplicate(state: DuplicateEntityToAnotherEnvironment) {
    const uuids = state.subjectUuids ?? [];

    if (state.subject === 'route') {
      // Batch case: multiple routes selected.
      if (uuids.length > 1) {
        this.entityInformation = {
          displayName: `${uuids.length} routes`,
          subject: state.subject,
          uuids: [...uuids]
        };

        return;
      }

      const entityToDuplicate = this.activeEnvironment.routes.find(
        (route: Route) => route.uuid === uuids[0]
      );
      this.entityInformation = {
        displayName: `${entityToDuplicate.method.toUpperCase()} /${
          entityToDuplicate.endpoint
        }`,
        subject: state.subject,
        uuids: [entityToDuplicate.uuid]
      };
    } else if (state.subject === 'databucket') {
      const entityToDuplicate = this.activeEnvironment.data.find(
        (databucket: DataBucket) => databucket.uuid === uuids[0]
      );
      this.entityInformation = {
        displayName: entityToDuplicate.name,
        subject: state.subject,
        uuids: [entityToDuplicate.uuid]
      };
    } else if (state.subject === 'callback') {
      const entityToDuplicate = this.activeEnvironment.callbacks.find(
        (cb: Callback) => cb.uuid === uuids[0]
      );
      this.entityInformation = {
        displayName: entityToDuplicate.name,
        subject: state.subject,
        uuids: [entityToDuplicate.uuid]
      };
    }
  }
}
