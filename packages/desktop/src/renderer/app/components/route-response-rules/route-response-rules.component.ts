import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup
} from '@angular/forms';
import {
  BuildResponseRule,
  ReorderAction,
  ResponseRule,
  ResponseRuleOperators,
  ResponseRuleTargets,
  Route,
  RouteResponse,
  RulesDisablingResponseModes
} from '@mockoon/commons';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil, tap } from 'rxjs/operators';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import { Texts } from 'src/renderer/app/constants/texts.constant';
import {
  DropdownItems,
  ToggleItems
} from 'src/renderer/app/models/common.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { moveItemToTargetIndex } from 'src/renderer/app/stores/reducer-utils';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-route-response-rules',
  templateUrl: 'route-response-rules.component.html',
  styleUrls: ['./route-response-rules.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RouteResponseRulesComponent implements OnInit, OnDestroy {
  @Input()
  public activeRouteResponse$: Observable<RouteResponse>;
  @Input()
  public activeRoute$: Observable<Route>;
  @Output()
  public ruleAdded: EventEmitter<any> = new EventEmitter();
  public routeResponse$: Observable<RouteResponse>;
  public form: UntypedFormGroup;
  public readonly rulesDisablingResponseModes = RulesDisablingResponseModes;
  public responseRuleTargets: DropdownItems<ResponseRuleTargets> = [
    { value: 'body', label: 'Body' },
    { value: 'query', label: 'Query string' },
    { value: 'header', label: 'Header' },
    { value: 'cookie', label: 'Cookie' },
    { value: 'params', label: 'Route params' },
    { value: 'global_var', label: 'Global variable' },
    { value: 'request_number', label: 'Request number (starting at 1)' }
  ];
  public responseRuleOperators: DropdownItems<ResponseRuleOperators> = [
    { value: 'equals', label: 'equals' },
    { value: 'regex', label: 'regex' },
    { value: 'regex_i', label: 'regex (i)' },
    { value: 'null', label: 'null' },
    { value: 'empty_array', label: 'empty array' }
  ];
  public modifierPlaceholders: Record<ResponseRuleTargets, string> = {
    body: 'JSONPath or object path (empty for full body)',
    query: 'JSONPath or object path',
    header: 'Header name',
    cookie: 'Cookie name',
    params: 'Route parameter name',
    global_var: 'JSONPath or object path (start with var name)',
    request_number: ''
  };
  public valuePlaceholders = {
    equals: 'Value',
    regex: 'Regex (without /../)',
    regex_i: 'Regex (without /../i)',
    null: '',
    empty_array: ''
  };
  public operatorDisablingForTargets = {
    request_number: ['null', 'empty_array'],
    cookie: ['empty_array']
  };
  public rulesOperators: ToggleItems = [
    {
      value: 'OR',
      label: 'OR'
    },
    {
      value: 'AND',
      label: 'AND'
    }
  ];
  public rulesInvert: ToggleItems = [
    { icon: 'priority_high', tooltip: 'Invert condition' }
  ];
  public deleteRuleRequested$ = new TimedBoolean();
  public texts = Texts;
  private listenToChanges = true;
  private destroy$ = new Subject<void>();

  constructor(
    private environmentsService: EnvironmentsService,
    private formBuilder: UntypedFormBuilder,
    private store: Store
  ) {}

  public get rules() {
    return this.form.get('rules') as UntypedFormArray;
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      rulesOperator: ['OR'],
      rules: this.formBuilder.array([])
    });

    // subscribe to active route response to reset the form
    this.routeResponse$ = this.activeRouteResponse$.pipe(
      filter((activeRouteResponse) => !!activeRouteResponse),
      this.store.distinctUUIDOrForce(),
      tap((routeResponse) => {
        this.replaceRules(routeResponse.rules, false);
        this.form.get('rulesOperator').setValue(routeResponse.rulesOperator, {
          emitEvent: false
        });
      })
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
   * Add a new rule to the list if possible
   */
  public addRule() {
    this.rules.push(this.formBuilder.group(BuildResponseRule()));

    this.ruleAdded.emit();
  }

  public reorderRules(reorderAction: ReorderAction) {
    // store is driving the reordering
    this.environmentsService.updateActiveRouteResponse(
      {
        rules: moveItemToTargetIndex(
          this.rules.value,
          reorderAction.reorderActionType,
          reorderAction.sourceId as number,
          reorderAction.targetId as number
        )
      },
      // it's a store forced event, triggering a form update here
      true
    );
  }

  /**
   * Remove a rule from the list
   */
  public removeRule(ruleIndex: number) {
    const confirmValue = this.deleteRuleRequested$.readValue(ruleIndex);

    if (confirmValue.enabled && ruleIndex === confirmValue.payload) {
      this.rules.removeAt(ruleIndex);
    }
  }

  /**
   * Replace all rules in the FormArray
   */
  private replaceRules(newRules: ResponseRule[], listenToChanges = true) {
    this.listenToChanges = listenToChanges;

    this.rules.clear();

    newRules.forEach((rule) => {
      this.rules.push(
        this.formBuilder.group({
          ...rule
        } as ResponseRule)
      );
    });

    this.listenToChanges = true;
  }
}
