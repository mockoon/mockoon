import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilKeyChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { SelectOptionsList } from 'src/app/models/common.model';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { ResponseRule, ResponseRuleTargets, RouteResponse } from 'src/app/types/route.type';

@Component({
  selector: 'app-route-response-rules',
  templateUrl: 'route-response-rules.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RouteResponseRulesComponent implements OnInit, OnDestroy {
  @Input() activeRouteResponse$: Observable<RouteResponse>;
  @Output() ruleAdded: EventEmitter<any> = new EventEmitter();
  public rules$: Observable<ResponseRule[]>;
  public form: FormGroup;
  public responseRuleTargets: SelectOptionsList<ResponseRuleTargets> = [
    { code: 'body', text: 'Body path (JSON / form data)' },
    { code: 'query', text: 'Query string' },
    { code: 'header', text: 'Header' },
    { code: 'params', text: 'Route params' }
  ];
  private listenToChanges = true;
  private destroy$ = new Subject<void>();

  constructor(
    private environmentsService: EnvironmentsService,
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      rules: this.formBuilder.array([])
    });

    // subscribe to rules changes to reset the form
    this.rules$ = this.activeRouteResponse$.pipe(
      filter((activeRouteResponse) => !!activeRouteResponse),
      distinctUntilKeyChanged('uuid'),
      map((activeRouteResponse) => activeRouteResponse.rules),
      tap((rules) => {
        this.replaceRules(rules, false);
      })
    );

    // subscribe to changes and send new rules values to the store
    this.form
      .get('rules')
      .valueChanges.pipe(
        filter(() => this.listenToChanges),
        debounceTime(100),
        tap((newRules) => {
          this.environmentsService.updateActiveRouteResponse({
            rules: newRules
          });
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
   * Replace all rules in the FormArray
   */
  private replaceRules(newRules: ResponseRule[], listenToChanges = true) {
    this.listenToChanges = listenToChanges;
    const formRulesArray = this.form.get('rules') as FormArray;

    formRulesArray.clear();

    newRules.forEach((rule) => {
      formRulesArray.push(this.formBuilder.group(<ResponseRule>{ ...rule }));
    });

    this.changeDetectorRef.markForCheck();

    this.listenToChanges = true;
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
}
