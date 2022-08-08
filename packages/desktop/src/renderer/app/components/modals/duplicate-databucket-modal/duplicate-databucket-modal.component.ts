import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { DataBucket, Environment } from '@mockoon/commons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { DuplicateDatabucketToAnotherEnvironment } from 'src/renderer/app/models/store.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { finalizeDatabucketDuplicationToAnotherEnvironmentAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-duplicate-databucket-modal',
  templateUrl: './duplicate-databucket-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DuplicateDatabucketModalComponent
  implements OnDestroy, AfterViewInit
{
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
  public databucketToDuplicate: DataBucket;

  private databucketDuplicationState$ = this.store.select(
    'duplicateDatabucketToAnotherEnvironment'
  );

  private databucketDuplicationSubscription: Subscription;

  constructor(
    private modalService: NgbModal,
    private store: Store,
    private environmentsService: EnvironmentsService
  ) {}

  private get activeEnvironment() {
    return this.store.getActiveEnvironment();
  }

  ngAfterViewInit() {
    this.databucketDuplicationSubscription =
      this.databucketDuplicationState$.subscribe(
        (state: DuplicateDatabucketToAnotherEnvironment) => {
          if (state.moving) {
            this.extractDatabucketToDuplicate(state);
            this.openModal();
          }
        }
      );
  }

  ngOnDestroy() {
    this.databucketDuplicationSubscription.unsubscribe();
  }

  public closeModal() {
    this.store.update(
      finalizeDatabucketDuplicationToAnotherEnvironmentAction()
    );
    this.modalService.dismissAll(false);
  }

  public chooseTargetEnvironment(targetEnvironment: Environment) {
    this.environmentsService.duplicateDatabucketInAnotherEnvironment(
      this.databucketToDuplicate.uuid,
      targetEnvironment.uuid
    );
    this.closeModal();
  }

  private openModal() {
    this.modalService.open(this.modal);
  }

  private extractDatabucketToDuplicate(
    state: DuplicateDatabucketToAnotherEnvironment
  ) {
    this.databucketToDuplicate = this.activeEnvironment.data.find(
      (databucket: DataBucket) => databucket.uuid === state.databucketUUID
    );
  }
}
