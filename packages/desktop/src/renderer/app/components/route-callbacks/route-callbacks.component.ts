import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import {
  BuildResponseCallback,
  CallbackInvocation,
  Environment,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { Observable, Subject } from 'rxjs';
import {
  distinctUntilKeyChanged,
  filter,
  map,
  takeUntil,
  tap
} from 'rxjs/operators';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import { Texts } from 'src/renderer/app/constants/texts.constant';
import { DropdownItems } from 'src/renderer/app/models/common.model';
import { DropAction } from 'src/renderer/app/models/ui.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { moveItemToTargetIndex } from 'src/renderer/app/stores/reducer-utils';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-route-callbacks',
  templateUrl: 'route-callbacks.component.html',
  styleUrls: ['./route-callbacks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RouteCallbacksComponent implements OnInit, OnDestroy {
  @Input()
  public activeRouteResponse$: Observable<RouteResponse>;
  @Input()
  public activeRoute$: Observable<Route>;
  @Output()
  public callbackAdded: EventEmitter<any> = new EventEmitter();
  public activeEnvironment$: Observable<Environment>;
  public routeResponse$: Observable<RouteResponse>;
  public form: FormGroup;
  public deleteCallbackRequested$ = new TimedBoolean();
  public texts = Texts;
  public callbacks$: Observable<DropdownItems>;
  public Infinity = Infinity;
  private listenToChanges = true;
  private destroy$ = new Subject<void>();

  constructor(
    private environmentsService: EnvironmentsService,
    private store: Store,
    private formBuilder: FormBuilder
  ) {}

  public get callbacks() {
    return this.form.get('callbacks') as FormArray;
  }

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.form = this.formBuilder.group({
      callbacks: this.formBuilder.array([])
    });

    // subscribe to active route response to reset the form
    this.routeResponse$ = this.activeRouteResponse$.pipe(
      filter((activeRouteResponse) => !!activeRouteResponse),
      distinctUntilKeyChanged('uuid'),
      tap((routeResponse) => {
        this.replaceCallbacks(routeResponse.callbacks, false);
      })
    );

    // read defined callbacks in the active environment.
    this.callbacks$ = this.activeEnvironment$.pipe(
      filter((activeEnvironment) => !!activeEnvironment),
      map((activeEnvironment) =>
        activeEnvironment.callbacks.map((cb) => ({
          value: cb.uuid,
          label: `${cb.name}${cb.documentation ? ' - ' + cb.documentation : ''}`
        }))
      )
    );

    // subscribe to changes and send new values to the store
    this.form.valueChanges
      .pipe(
        filter(() => this.listenToChanges),
        tap((newProperties) => {
          this.environmentsService.updateActiveRouteResponse(newProperties);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  /**
   * Add a new callback to the list if possible
   */
  public addCallback() {
    this.callbacks.push(this.formBuilder.group(BuildResponseCallback()));

    this.callbackAdded.emit();
  }

  public reorganizeCallbacks(dropAction: DropAction) {
    this.replaceCallbacks(
      moveItemToTargetIndex(
        this.callbacks.value,
        dropAction.dropActionType,
        dropAction.sourceId as number,
        dropAction.targetId as number
      ),
      true
    );
  }

  /**
   * Navigate to the definition of provided callback.
   *
   * @param callbackUUID callback uuid
   */
  public goToCallbackDefinition(callbackUUID: string) {
    this.environmentsService.navigateToCallbackDefinition(callbackUUID);
  }

  /**
   * Remove a callback from the list
   */
  public removeCallback(callbackIndex: number) {
    const confirmValue = this.deleteCallbackRequested$.readValue(callbackIndex);

    if (confirmValue.enabled && callbackIndex === confirmValue.payload) {
      this.callbacks.removeAt(callbackIndex);
    }
  }

  /**
   * Replace all callbacks in the FormArray
   */
  private replaceCallbacks(
    newCallbacks: CallbackInvocation[],
    listenToChanges = true
  ) {
    this.listenToChanges = listenToChanges;

    this.callbacks.clear();

    newCallbacks.forEach((cb) => {
      this.callbacks.push(
        this.formBuilder.group({
          ...cb
        } as CallbackInvocation)
      );
    });

    this.listenToChanges = true;
  }
}
