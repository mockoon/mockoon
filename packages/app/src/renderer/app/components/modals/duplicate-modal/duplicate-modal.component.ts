import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Environment } from '@mockoon/commons';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
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
export class DuplicateModalComponent {
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
  public entityDuplicationState$ = this.store
    .select('duplicateEntityToAnotherEnvironment')
    .pipe(
      tap((state: DuplicateEntityToAnotherEnvironment) => {
        if (state.moving) {
          if (!state.subjectUuids || state.subjectUuids.length === 0) {
            this.store.update(
              cancelEntityDuplicationToAnotherEnvironmentAction()
            );
            this.uiService.closeModal('duplicate_to_environment', false);
          }
        }
      })
    );

  public close() {
    this.uiService.closeModal('duplicate_to_environment', false);
  }

  public chooseTargetEnvironment(
    targetEnvironment: Environment,
    state: DuplicateEntityToAnotherEnvironment
  ) {
    for (const uuid of state.subjectUuids) {
      if (state.subject === 'route') {
        this.environmentsService.duplicateRouteInAnotherEnvironment(
          uuid,
          targetEnvironment.uuid
        );
      } else if (state.subject === 'databucket') {
        this.environmentsService.duplicateDatabucketInAnotherEnvironment(
          uuid,
          targetEnvironment.uuid
        );
      } else if (state.subject === 'callback') {
        this.environmentsService.duplicateCallbackInAnotherEnvironment(
          uuid,
          targetEnvironment.uuid
        );
      }
    }

    this.store.update(cancelEntityDuplicationToAnotherEnvironmentAction());
    this.uiService.closeModal('duplicate_to_environment');
  }
}
