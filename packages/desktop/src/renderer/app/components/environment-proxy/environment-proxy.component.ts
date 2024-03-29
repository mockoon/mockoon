import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
  Environment,
  EnvironmentDefault,
  Header,
  IsValidURL
} from '@mockoon/commons';
import { Observable, Subject, merge } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { HeadersProperties } from 'src/renderer/app/models/common.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-environment-proxy',
  templateUrl: './environment-proxy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnvironmentProxyComponent implements OnInit, OnDestroy {
  public activeEnvironment$: Observable<Environment>;
  public isValidURL = IsValidURL;
  public scrollToBottom = this.uiService.scrollToBottom;
  public environmentProxyForm: UntypedFormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private environmentsService: EnvironmentsService,
    private uiService: UIService,
    private store: Store,
    private formBuilder: UntypedFormBuilder
  ) {}

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();

    this.initForms();
    this.initFormValues();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  /**
   * Update the store when proxy headers lists are updated
   */
  public headersUpdated(targetHeaders: HeadersProperties, headers: Header[]) {
    this.environmentsService.updateActiveEnvironment({
      [targetHeaders]: headers
    });
  }

  /**
   * Init active environment proxy form
   */
  private initForms() {
    this.environmentProxyForm = this.formBuilder.group({
      proxyMode: [EnvironmentDefault.proxyMode],
      proxyHost: [EnvironmentDefault.proxyHost],
      proxyRemovePrefix: [EnvironmentDefault.proxyRemovePrefix]
    });

    // send new activeEnvironmentForm values to the store, one by one
    merge(
      ...Object.keys(this.environmentProxyForm.controls).map((controlName) =>
        this.environmentProxyForm.get(controlName).valueChanges.pipe(
          map((newValue) => ({
            [controlName]: newValue
          }))
        )
      )
    )
      .pipe(
        tap((newProperty) => {
          this.environmentsService.updateActiveEnvironment(newProperty);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Listen to the store to init proxy form values
   */
  private initFormValues() {
    this.activeEnvironment$
      .pipe(
        filter((environment) => !!environment),
        this.store.distinctUUIDOrForce(),
        tap((activeEnvironment) => {
          this.environmentProxyForm.setValue(
            {
              proxyMode: activeEnvironment.proxyMode,
              proxyHost: activeEnvironment.proxyHost,
              proxyRemovePrefix: activeEnvironment.proxyRemovePrefix
            },
            { emitEvent: false }
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
}
