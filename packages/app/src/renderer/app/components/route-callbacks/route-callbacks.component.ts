import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  BuildResponseCallback,
  Callback,
  CallbackInvocation,
  Environment,
  RouteResponse
} from '@mockoon/commons';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import { CustomSelectComponent } from 'src/renderer/app/components/custom-select/custom-select.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { Texts } from 'src/renderer/app/constants/texts.constant';
import { InputNumberDirective } from 'src/renderer/app/directives/input-number.directive';
import { DropdownItems } from 'src/renderer/app/models/common.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-route-callbacks',
  templateUrl: 'route-callbacks.component.html',
  styleUrls: ['./route-callbacks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    CustomSelectComponent,
    NgbTooltip,
    SvgComponent,
    InputNumberDirective,
    AsyncPipe
  ]
})
export class RouteCallbacksComponent {
  private environmentsService = inject(EnvironmentsService);
  private store = inject(Store);
  private formBuilder = inject(FormBuilder);
  public activeRouteResponse$ = this.store.selectActiveRouteResponse();
  public activeRoute$ = this.store.selectActiveRoute();
  @Output()
  public callbackAdded = new EventEmitter<void>();
  public activeEnvironment$: Observable<Environment>;
  public routeResponse$: Observable<RouteResponse>;
  public form: FormGroup;
  public deleteCallbackRequested$ = new TimedBoolean();
  public texts = Texts;
  public callbacks$: Observable<DropdownItems>;
  public Infinity = Infinity;
  public allCallbacks$: Observable<Callback[]>;
  private listenToChanges = true;

  public get callbacks() {
    return this.form.get('callbacks') as FormArray;
  }

  constructor() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.form = this.formBuilder.group({
      callbacks: this.formBuilder.array([])
    });

    // subscribe to active route response to reset the form
    this.routeResponse$ = this.activeRouteResponse$.pipe(
      filter((activeRouteResponse) => !!activeRouteResponse),
      this.store.distinctUUIDOrForce(),
      tap((routeResponse) => {
        this.replaceCallbacks(routeResponse.callbacks, false);
      })
    );

    this.allCallbacks$ = this.activeEnvironment$.pipe(
      filter((activeEnvironment) => !!activeEnvironment),
      map((activeEnvironment) => activeEnvironment.callbacks)
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
        takeUntilDestroyed()
      )
      .subscribe();
  }

  /**
   * Add a new callback to the list if possible
   */
  public addCallback(callbacks: Callback[]) {
    if (callbacks.length > 0) {
      this.callbacks.push(
        this.formBuilder.group(BuildResponseCallback(callbacks[0].uuid))
      );
    } else {
      this.callbacks.push(this.formBuilder.group(BuildResponseCallback()));
    }

    this.callbackAdded.emit();
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
