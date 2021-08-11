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
  LogicalOperators,
  ResponseRule,
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
import { SelectOptionsList } from 'src/renderer/app/models/common.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { SchemasBuilderService } from 'src/renderer/app/services/schemas-builder.service';

@Component({
  selector: 'app-route-response-rules',
  templateUrl: 'route-response-rules.component.html',
  styleUrls: ['route-response-rules.component.scss'],
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
    { code: 'params', text: 'Route params' },
    { code: 'request_number', text: 'Request number (starting at 1)' }
  ];
  public modifierPlaceholders = {
    body: 'Object path or empty for full body',
    query: 'Property name or object path',
    header: 'Header name',
    params: 'Route parameter name',
    request_number: ''
  };
  public rulesOperatorsList: LogicalOperators[] = ['OR', 'AND'];
  private listenToChanges = true;
  private destroy$ = new Subject<void>();

  public get rules() {
    return this.form.get('rules') as FormArray;
  }

  constructor(
    private environmentsService: EnvironmentsService,
    private formBuilder: FormBuilder,
    private schemasBuilderService: SchemasBuilderService
  ) {}

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
    this.rules.push(
      this.formBuilder.group(this.schemasBuilderService.buildResponseRule())
    );

    this.ruleAdded.emit();
  }

  /**
   * Remove a rule from the list
   */
  public removeRule(ruleIndex: number) {
    this.rules.removeAt(ruleIndex);
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
