import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { distinctUntilKeyChanged, filter, map } from 'rxjs/operators';
import { SelectOptionsList } from 'src/app/models/common.model';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { ResponseRule, ResponseRuleTargets, RouteResponse } from 'src/app/types/route.type';


@Component({
  selector: 'app-route-response-rules',
  templateUrl: 'route-response-rules.component.html'
})
export class RouteResponseRulesComponent implements OnInit {
  @Input() data$: Observable<RouteResponse>;
  @Output() ruleAdded: EventEmitter<any> = new EventEmitter();
  public form: FormGroup;
  public rulesFormChanges: Subscription;
  public responseRuleTargets: SelectOptionsList<ResponseRuleTargets> = [
    { code: 'body', text: 'Body path (JSON / form data)' },
    { code: 'query', text: 'Query string' },
    { code: 'header', text: 'Header' },
    { code: 'params', text: 'Route params' }
  ];

  constructor(
    private environmentsService: EnvironmentsService,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      rules: this.formBuilder.array([])
    });

    // subscribe to rules changes to reset the form
    this.data$.pipe(
      filter(data => !!data),
      distinctUntilKeyChanged('uuid')
    ).subscribe(data => {
      // unsubscribe to prevent emitting when clearing the FormArray
      if (this.rulesFormChanges) {
        this.rulesFormChanges.unsubscribe();
      }

      this.replaceRules(data.rules);

      // subscribe to changes and send new rules values to the store
      this.rulesFormChanges = this.form.get('rules').valueChanges.pipe(
        map(newValue => ({ rules: newValue }))
      ).subscribe(newProperty => {
        this.environmentsService.updateActiveRouteResponse(newProperty);
      });
    });
  }

  /**
   * Replace all rules in the FormArray
   */
  private replaceRules(newRules: ResponseRule[]) {
    const formRulesArray = (this.form.get('rules') as FormArray);

    // clear formArray (with Angular 8 use .clear())
    while (formRulesArray.length !== 0) {
      formRulesArray.removeAt(0);
    }

    newRules.forEach(rule => {
      formRulesArray.push(this.formBuilder.group(<ResponseRule>{ ...rule }));
    });
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
