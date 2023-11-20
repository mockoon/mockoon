import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  BodyTypes,
  Callback,
  CallbackDefault,
  Environment,
  Header,
  Methods,
  MimeTypesWithTemplating
} from '@mockoon/commons';
import {
  Observable,
  Subject,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  from,
  map,
  merge,
  mergeMap,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import {
  CallbackResponseUsage,
  CallbackSpecTabNameType,
  CallbackTabsNameType,
  CallbackUsage
} from 'src/renderer/app/models/callback.model';
import {
  DropdownItems,
  ToggleItems
} from 'src/renderer/app/models/common.model';
import { DialogsService } from 'src/renderer/app/services/dialogs.service';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-environment-callbacks',
  templateUrl: './environment-callbacks.component.html',
  styleUrls: ['./environment-callbacks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnvironmentCallbacksComponent implements OnInit, OnDestroy {
  public activeEnvironment$: Observable<Environment>;
  public activeCallback$: Observable<Callback>;
  public activeCallbackForm: FormGroup;
  public activeTab$: Observable<CallbackTabsNameType>;
  public activeSpecTab$: Observable<CallbackSpecTabNameType>;
  public activeCallbackUsages$: Observable<CallbackUsage[]>;
  public activeCallbackFileMimeType$: Observable<{
    mimeType: string;
    supportsTemplating: boolean;
  }>;
  public form: FormGroup;
  public focusableInputs = FocusableInputs;
  public bodyEditorConfig$: Observable<any>;
  public scrollToBottom = this.uiService.scrollToBottom;

  public databuckets$: Observable<DropdownItems>;
  public httpMethod = Methods;
  public bodySupportingMethods = [Methods.post, Methods.put, Methods.patch];
  public callbackMethods: DropdownItems<Methods> = [
    { value: Methods.get, label: 'GET', classes: 'route-badge-get-text' },
    { value: Methods.post, label: 'POST', classes: 'route-badge-post-text' },
    { value: Methods.put, label: 'PUT', classes: 'route-badge-put-text' },
    {
      value: Methods.patch,
      label: 'PATCH',
      classes: 'route-badge-patch-text'
    },
    {
      value: Methods.delete,
      label: 'DELETE',
      classes: 'route-badge-delete-text'
    },
    {
      value: Methods.head,
      label: 'HEAD',
      classes: 'route-badge-head-text'
    },
    {
      value: Methods.options,
      label: 'OPTIONS',
      classes: 'route-badge-options-text'
    }
  ];

  public bodyType: ToggleItems = [
    {
      value: 'INLINE',
      label: 'Inline'
    },
    {
      value: 'FILE',
      label: 'File'
    },
    {
      value: 'DATABUCKET',
      label: 'Data'
    }
  ];
  private destroy$ = new Subject<void>();

  constructor(
    private uiService: UIService,
    private store: Store,
    private environmentsService: EnvironmentsService,
    private formBuilder: FormBuilder,
    private dialogsService: DialogsService
  ) {}

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.activeCallback$ = this.store.selectActiveCallback();
    this.bodyEditorConfig$ = this.store.select('bodyEditorConfig');
    this.initForms();
    this.initFormValues();

    const activeCallbackId$ = this.activeCallback$.pipe(
      filter((cb) => !!cb),
      map((cb) => cb.uuid)
    );
    this.activeCallbackFileMimeType$ = this.activeCallback$.pipe(
      filter((cb) => !!cb),
      map((cb) => cb?.filePath),
      filter((filePath) => !!filePath),
      distinctUntilChanged(),
      mergeMap((filePath) =>
        from(MainAPI.invoke('APP_GET_MIME_TYPE', filePath))
      ),
      map((mimeType) => ({
        mimeType,
        supportsTemplating: MimeTypesWithTemplating.indexOf(mimeType) > -1
      }))
    );
    this.activeCallbackUsages$ = this.activeEnvironment$.pipe(
      map((env) => env.routes),
      withLatestFrom(activeCallbackId$),
      map(([routes, activeCallbackId]) =>
        routes
          .filter((r) => {
            if (r.responses) {
              return !!r.responses.find(
                (res) =>
                  res.callbacks?.find((cb) => cb.uuid === activeCallbackId)
              );
            }

            return false;
          })
          .map(
            (r) =>
              ({
                routeUUID: r.uuid,
                label: `${r.method.toUpperCase()} /${r.endpoint}`,
                responses: r.responses
                  ?.filter(
                    (rs) =>
                      rs.callbacks?.find((cb) => cb.uuid === activeCallbackId)
                  )
                  .map((rs) => ({
                    responseUUID: rs.uuid,
                    label: `Response ${rs.statusCode} ${rs.label}`
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label))
              }) as CallbackUsage
          )
          .sort((a, b) => a.label.localeCompare(b.label))
      )
    );

    this.databuckets$ = this.activeEnvironment$.pipe(
      filter((activeEnvironment) => !!activeEnvironment),
      map((activeEnvironment) =>
        activeEnvironment.data.map((data) => ({
          value: data.id,
          label: `${data.name}${
            data.documentation ? ' - ' + data.documentation : ''
          }`
        }))
      )
    );
    const callbackSettingsObj = this.store.select('callbackSettings');
    this.activeTab$ = callbackSettingsObj.pipe(map((val) => val.activeTab));
    this.activeSpecTab$ = callbackSettingsObj.pipe(
      map((val) => val.activeSpecTab)
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  /**
   * Open file browsing dialog
   */
  public browseFiles() {
    this.dialogsService
      .showOpenDialog('Choose a file', null, false)
      .pipe(
        tap((filePath) => {
          if (filePath) {
            this.activeCallbackForm.get('filePath').setValue(filePath);
          }
        })
      )
      .subscribe();
  }

  /**
   * Update the store when proxy headers lists are updated
   */
  public headersUpdated(headers: Header[]) {
    this.activeCallbackForm.patchValue({
      headers
    });
  }

  /**
   * Set the application active tab
   */
  public setActiveTab(tabName: CallbackTabsNameType) {
    this.environmentsService.setActiveTabInCallbackView(tabName);
  }

  /**
   * Set the application active tab
   */
  public setActiveSpecTab(tabName: CallbackSpecTabNameType) {
    this.environmentsService.setActiveSpecTabInCallbackView(tabName);
  }

  /**
   * Navigate to route response where this callback has been defined.
   * @param route
   */
  public navigateToRoute(
    route: CallbackUsage,
    response: CallbackResponseUsage
  ) {
    this.environmentsService.navigateToCallbackUsageInRoute(route, response);
  }

  private initForms() {
    this.activeCallbackForm = this.formBuilder.group({
      body: [CallbackDefault.body],
      bodyType: [CallbackDefault.bodyType],
      databucketID: [CallbackDefault.databucketID],
      documentation: [CallbackDefault.documentation],
      filePath: [CallbackDefault.filePath],
      headers: [CallbackDefault.headers],
      id: [CallbackDefault.id],
      method: [CallbackDefault.method],
      name: [CallbackDefault.name],
      sendFileAsBody: [CallbackDefault.sendFileAsBody],
      uri: [CallbackDefault.uri],
      uuid: [CallbackDefault.uuid]
    });

    // send new activeDatabucketForm values to the store, one by one
    merge(
      ...Object.keys(this.activeCallbackForm.controls).map((controlName) =>
        this.activeCallbackForm.get(controlName).valueChanges.pipe(
          map((newValue) => {
            if (
              controlName === 'method' &&
              this.bodySupportingMethods.indexOf(newValue as Methods) < 0
            ) {
              return {
                [controlName]: newValue,
                body: '',
                databucketID: '',
                filePath: '',
                bodyType: BodyTypes.INLINE
              };
            }

            return { [controlName]: newValue };
          })
        )
      )
    )
      .pipe(
        tap((newProperty) => {
          this.environmentsService.updateActiveCallback(newProperty);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Listen to stores to init form values
   */
  private initFormValues() {
    // subscribe to active route changes to reset the form
    this.activeCallback$
      .pipe(
        filter((cb) => !!cb),
        distinctUntilKeyChanged('uuid'),
        takeUntil(this.destroy$)
      )
      .subscribe((activeCallback) => {
        this.activeCallbackForm.patchValue(
          {
            body: activeCallback.body,
            bodyType: activeCallback.bodyType,
            databucketID: activeCallback.databucketID,
            documentation: activeCallback.documentation,
            filePath: activeCallback.filePath,
            headers: activeCallback.headers,
            id: activeCallback.id,
            method: activeCallback.method,
            name: activeCallback.name,
            sendFileAsBody: activeCallback.sendFileAsBody,
            uri: activeCallback.uri,
            uuid: activeCallback.uuid
          },
          { emitEvent: false }
        );
      });
  }
}
