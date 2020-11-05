import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
  debounceTime,
  distinctUntilKeyChanged,
  filter,
  takeUntil,
  tap
} from 'rxjs/operators';
import { SelectOptionsList } from 'src/app/models/common.model';
import { EnvironmentsService } from 'src/app/services/environments.service';

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
    { code: 'body', text: 'Body path (JSON / form data)' },
    { code: 'query', text: 'Query string' },
    { code: 'header', text: 'Header' },
    { code: 'params', text: 'Route params' }
  ];
  public rulesOperatorsList: LogicalOperators[] = ['OR', 'AND'];
  private listenToChanges = true;
  private destroy$ = new Subject<void>();

  constructor(
    private environmentsService: EnvironmentsService,
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef
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
        this.changeDetectorRef.markForCheck();
      })
    );

    // subscribe to changes and send new values to the store
    this.form.valueChanges
      .pipe(
        filter(() => this.listenToChanges),
        debounceTime(100),
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
    (this.form.get('rules') as FormArray).push(
      this.formBuilder.group(<ResponseRule>{
        target: null,
        modifier: null,
        value: null,
        isRegex: false
      })
    );

    this.ruleAdded.emit();
  }

  /**
   * Remove a rule from the list
   */
  public removeRule(ruleIndex: number) {
    (this.form.get('rules') as FormArray).removeAt(ruleIndex);
  }

  /**
   * Replace all rules in the FormArray
   */
  private replaceRules(newRules: ResponseRule[], listenToChanges = true) {
    this.listenToChanges = listenToChanges;
    const formRulesArray = this.form.get('rules') as FormArray;

    formRulesArray.clear();

    newRules.forEach((rule) => {
      formRulesArray.push(
        this.formBuilder.group(<ResponseRule>{
          ...rule
        })
      );
    });

    this.listenToChanges = true;
  }
}
