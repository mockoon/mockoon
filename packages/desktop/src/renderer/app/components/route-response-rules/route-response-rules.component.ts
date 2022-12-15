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
  BuildResponseRule,
  ResponseRule,
  ResponseRuleOperators,
  ResponseRuleTargets,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { Observable, Subject } from 'rxjs';
import {
  distinctUntilKeyChanged,
  filter,
  takeUntil,
  tap
} from 'rxjs/operators';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import { Texts } from 'src/renderer/app/constants/texts.constant';
import {
  SelectOptionsList,
  ToggleItems
} from 'src/renderer/app/models/common.model';
import { DropAction } from 'src/renderer/app/models/ui.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { moveItemToTargetIndex } from 'src/renderer/app/stores/reducer-utils';

@Component({
  selector: 'app-route-response-rules',
  templateUrl: 'route-response-rules.component.html',
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
  public form: FormGroup;
  public responseRuleTargets: SelectOptionsList<ResponseRuleTargets> = [
    { code: 'body', text: 'Body' },
    { code: 'query', text: 'Query string' },
    { code: 'header', text: 'Header' },
    { code: 'cookie', text: 'Cookie' },
    { code: 'params', text: 'Route params' },
    { code: 'request_number', text: 'Request number (starting at 1)' }
  ];
  public responseRuleOperators: SelectOptionsList<ResponseRuleOperators> = [
    { code: 'equals', text: 'equals' },
    { code: 'regex', text: 'regex match' },
    { code: 'null', text: 'null' },
    { code: 'empty_array', text: 'empty array' }
  ];
  public modifierPlaceholders = {
    body: 'Object path or empty for full body',
    query: 'Property name or object path',
    header: 'Header name',
    cookie: 'Cookie name',
    params: 'Route parameter name',
    request_number: ''
  };
  public valuePlaceholders = {
    equals: 'Value',
    regex: 'Regex (without /../)',
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
    private formBuilder: FormBuilder
  ) {}

  public get rules() {
    return this.form.get('rules') as FormArray;
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      rulesOperator: ['OR'],
      rules: this.formBuilder.array([])
    });

    // subscribe to active route response to reset the form
    this.routeResponse$ = this.activeRouteResponse$.pipe(
      filter((activeRouteResponse) => !!activeRouteResponse),
      distinctUntilKeyChanged('uuid'),
      tap((routeResponse) => {
        this.replaceRules(routeResponse.rules, false);
        this.form.get('rulesOperator').setValue(routeResponse.rulesOperator);
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

  public shouldOperatorBeDisabled(
    target: string,
    operator: ResponseRuleOperators
  ): boolean {
    const disablingTargets = this.operatorDisablingForTargets[target];
    if (!disablingTargets) {
      return null;
    }

    return disablingTargets.includes(operator) ? true : null;
  }

  public reorganizeRules(dropAction: DropAction) {
    this.replaceRules(
      moveItemToTargetIndex(
        this.rules.value,
        dropAction.dropActionType,
        dropAction.sourceId as number,
        dropAction.targetId as number
      ),
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
