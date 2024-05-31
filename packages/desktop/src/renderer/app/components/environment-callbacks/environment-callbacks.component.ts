import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
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
  filter,
  from,
  map,
  merge,
  mergeMap,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs';
import { DropdownMenuComponent } from 'src/renderer/app/components/dropdown-menu/dropdown-menu.component';
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

type fileDropdownMenuPayload = { filePath: string; environmentUuid: string };

@Component({
  selector: 'app-environment-callbacks',
  templateUrl: './environment-callbacks.component.html',
  styleUrls: ['./environment-callbacks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnvironmentCallbacksComponent implements OnInit, OnDestroy {
  public activeEnvironment$: Observable<Environment>;
  public hasCallbacks$: Observable<boolean>;
  public activeCallback$: Observable<Callback>;
  public activeCallbackForm: UntypedFormGroup;
  public activeTab$: Observable<CallbackTabsNameType>;
  public activeSpecTab$: Observable<CallbackSpecTabNameType>;
  public activeCallbackUsages$: Observable<CallbackUsage[]>;
  public activeCallbackFileMimeType$: Observable<{
    mimeType: string;
    supportsTemplating: boolean;
  }>;
  public focusableInputs = FocusableInputs;
  public bodyEditorConfig$: Observable<any>;
  public scrollToBottom = this.uiService.scrollToBottom;

  public databuckets$: Observable<DropdownItems>;
  public httpMethod = Methods;
  public bodySupportingMethods = [Methods.post, Methods.put, Methods.patch];
  public callbackMethods: DropdownItems<Methods> = [
    { value: Methods.get, label: 'GET', classes: 'color-method-get' },
    { value: Methods.post, label: 'POST', classes: 'color-method-post' },
    { value: Methods.put, label: 'PUT', classes: 'color-method-put' },
    {
      value: Methods.patch,
      label: 'PATCH',
      classes: 'color-method-patch'
    },
    {
      value: Methods.delete,
      label: 'DELETE',
      classes: 'color-method-delete'
    },
    {
      value: Methods.head,
      label: 'HEAD',
      classes: 'color-method-head'
    },
    {
      value: Methods.options,
      label: 'OPTIONS',
      classes: 'color-method-options'
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
  public fileDropdownMenuItems: DropdownMenuComponent['items'] = [
    {
      label: 'Browse',
      icon: 'find_in_page',
      twoSteps: false,
      action: () => {
        this.dialogsService
          .showOpenDialog('Choose a file', null, false)
          .pipe(
            tap((filePaths) => {
              if (filePaths[0]) {
                this.activeCallbackForm.get('filePath').setValue(filePaths[0]);
              }
            })
          )
          .subscribe();
      }
    },
    {
      label: 'Show file in explorer/finder',
      icon: 'folder',
      twoSteps: false,
      action: ({ environmentUuid, filePath }: fileDropdownMenuPayload) => {
        const environmentPath = this.store.getEnvironmentPath(environmentUuid);

        MainAPI.send('APP_OPEN_FILE', filePath, environmentPath);
      }
    },
    {
      label: 'Open file in editor',
      icon: 'file_open',
      twoSteps: false,
      action: ({ environmentUuid, filePath }: fileDropdownMenuPayload) => {
        const environmentPath = this.store.getEnvironmentPath(environmentUuid);

        MainAPI.send('APP_OPEN_FILE', filePath, environmentPath);
      }
    }
  ];
  private destroy$ = new Subject<void>();

  constructor(
    private uiService: UIService,
    private store: Store,
    private environmentsService: EnvironmentsService,
    private formBuilder: UntypedFormBuilder,
    private dialogsService: DialogsService
  ) {}

  ngOnInit() {
    this.activeEnvironment$ = this.store
      .selectActiveEnvironment()
      .pipe(filter((activeEnvironment) => !!activeEnvironment));
    this.hasCallbacks$ = this.activeEnvironment$.pipe(
      map((activeEnvironment) => activeEnvironment.callbacks.length > 0)
    );
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
              return !!r.responses.find((res) =>
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
                  ?.filter((rs) =>
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
      method: [CallbackDefault.method],
      name: [CallbackDefault.name],
      sendFileAsBody: [CallbackDefault.sendFileAsBody],
      uri: [CallbackDefault.uri]
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
              this.activeCallbackForm
                .get('bodyType')
                .setValue(BodyTypes.INLINE, { emitEvent: false });
              this.activeCallbackForm
                .get('body')
                .setValue('', { emitEvent: false });
              this.activeCallbackForm
                .get('filePath')
                .setValue('', { emitEvent: false });
              this.activeCallbackForm
                .get('databucketID')
                .setValue('', { emitEvent: false });

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
        this.store.distinctUUIDOrForce(),
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
            method: activeCallback.method,
            name: activeCallback.name,
            sendFileAsBody: activeCallback.sendFileAsBody,
            uri: activeCallback.uri
          },
          { emitEvent: false }
        );
      });
  }
}
