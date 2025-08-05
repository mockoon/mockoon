import { AsyncPipe, NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup
} from '@angular/forms';
import {
  DeployInstance,
  Plans,
  SyncDisconnectReasons,
  SyncErrors
} from '@mockoon/cloud';
import {
  Environment,
  Environments,
  ReorderAction,
  ReorderableContainers
} from '@mockoon/commons';
import {
  NgbCollapse,
  NgbPopover,
  NgbTooltip
} from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject, combineLatest, merge, of } from 'rxjs';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  takeUntil,
  tap
} from 'rxjs/operators';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import {
  DropdownMenuComponent,
  DropdownMenuElement,
  DropdownMenuItem
} from 'src/renderer/app/components/dropdown-menu/dropdown-menu.component';
import { EditableElementComponent } from 'src/renderer/app/components/editable-element/editable-element.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { TeamPresenceComponent } from 'src/renderer/app/components/team-presence/team-presence.component';
import { DraggableDirective } from 'src/renderer/app/directives/draggable.directive';
import { DropzoneDirective } from 'src/renderer/app/directives/dropzone.directive';
import { ResizeColumnDirective } from 'src/renderer/app/directives/resize-column.directive';
import { ScrollWhenActiveDirective } from 'src/renderer/app/directives/scroll-to-active.directive';
import { TourStepDirective } from 'src/renderer/app/directives/tour-step.directive';
import { buildApiUrl } from 'src/renderer/app/libs/utils.lib';
import { EnvironmentsStatuses } from 'src/renderer/app/models/store.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { SyncService } from 'src/renderer/app/services/sync.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { UserService } from 'src/renderer/app/services/user.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import {
  EnvironmentsCategories,
  RecentLocalEnvironment,
  Settings
} from 'src/shared/models/settings.model';

type dropdownMenuPayload = { environmentUuid: string; syncStatus: boolean };

@Component({
  selector: 'app-environments-menu',
  templateUrl: './environments-menu.component.html',
  styleUrls: ['./environments-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgbPopover,
    TourStepDirective,
    NgStyle,
    NgClass,
    DraggableDirective,
    DropzoneDirective,
    SvgComponent,
    NgbTooltip,
    DropdownMenuComponent,
    NgbCollapse,
    NgTemplateOutlet,
    ResizeColumnDirective,
    ScrollWhenActiveDirective,
    FormsModule,
    ReactiveFormsModule,
    EditableElementComponent,
    TeamPresenceComponent,
    AsyncPipe
  ]
})
export class EnvironmentsMenuComponent implements OnInit, OnDestroy {
  public activeEnvironment$: Observable<Environment>;
  public environments$: Observable<Environments>;
  public cloudEnvironments$: Observable<Environments>;
  public instanceUrls$: Observable<
    Record<string, { webUrl: string; localUrl: string }>
  >;
  public environmentsStatus$: Observable<EnvironmentsStatuses>;
  public settings$: Observable<Settings>;
  public menuSize = Config.defaultMainMenuSize;
  public editingName = false;
  public activeEnvironmentForm: UntypedFormGroup;
  public dragEnabled = true;
  public logsRecording$ = this.eventsService.logsRecording$;
  public user$ = this.store.select('user');
  public sync$ = this.store.select('sync');
  public categories$: Observable<typeof this.categories>;
  public cloudPlansURL = Config.cloudPlansURL;
  public isCloudEnabled$: Observable<boolean>;
  public isConnected$ = this.user$.pipe(map((user) => !!user));
  public syncAlert$: Observable<string>;
  public clearRecentLocalEnvironmentsConfirm$ = new TimedBoolean();
  public offlineWarningLink = Config.docs.cloudSyncOffline;
  public isWeb = Config.isWeb;
  public deployInstances$ = this.store.select('deployInstances');
  public buildApiUrl = buildApiUrl;
  public alertLabels = {
    VERSION_TOO_OLD_WARNING:
      'We will soon not support your Mockoon version anymore. Please update.',
    OFFLINE_WARNING:
      'Concurrent offline editing may result in conflicts. In case of conflict, you will be prompted to choose between the local or remote version. Click to learn more.',
    OFFLINE_WARNING_SOLO:
      'Concurrent offline editing (multiple devices) may result in conflicts. In case of conflict, you will be prompted to choose between the local or remote version. Click to learn more.',
    OFFLINE_WARNING_GROUP:
      'Concurrent offline editing may result in conflicts. In case of conflict, you will be prompted to choose between the local or remote version. Click to learn more.'
  };
  public commonDropdownMenuItems: DropdownMenuItem[] = [
    {
      label: this.isWeb ? 'Duplicate' : 'Duplicate to the cloud',
      icon: this.isWeb ? 'content_copy' : 'cloud',
      twoSteps: false,
      disabled$: () =>
        this.store.select('sync').pipe(map((sync) => !sync.status)),
      action: ({ environmentUuid }: dropdownMenuPayload) => {
        this.environmentsService.duplicateToCloud(environmentUuid).subscribe();
      }
    },
    ...(this.isWeb
      ? []
      : [
          {
            label: 'Duplicate to local',
            icon: 'content_copy',
            twoSteps: false,
            action: ({ environmentUuid }: dropdownMenuPayload) => {
              this.environmentsService
                .duplicateEnvironment(environmentUuid)
                .subscribe();
            }
          }
        ]),
    {
      label: this.isWeb ? 'Manage deployment' : 'Deploy to the cloud',
      icon: this.isWeb ? 'server_settings' : 'backup',
      twoSteps: false,
      disabled$: () =>
        this.store
          .select('user')
          .pipe(map((user) => !user || user?.plan === 'FREE')),
      action: ({ environmentUuid }: dropdownMenuPayload) => {
        this.uiService.openModal('deploy', environmentUuid);
      }
    },
    ...(this.isWeb
      ? []
      : [
          {
            label: 'Copy configuration to clipboard (JSON)',
            icon: 'assignment',
            twoSteps: false,
            action: ({ environmentUuid }: dropdownMenuPayload) => {
              this.environmentsService.copyEnvironmentToClipboard(
                environmentUuid
              );
            }
          }
        ])
  ];
  public localEnvironmentDropdownMenuItems: DropdownMenuItem[] = [
    ...this.commonDropdownMenuItems,
    {
      label: 'Show data file in explorer/finder',
      icon: 'folder',
      twoSteps: false,
      action: ({ environmentUuid }: dropdownMenuPayload) => {
        this.environmentsService.showEnvironmentFileInFolder(environmentUuid);
      }
    },
    {
      label: 'Move data file to folder',
      icon: 'folder_move',
      twoSteps: false,
      action: ({ environmentUuid }: dropdownMenuPayload) => {
        this.environmentsService
          .moveEnvironmentFileToFolder(environmentUuid)
          .subscribe();
      }
    },
    {
      label: 'Close environment',
      icon: 'close',
      twoSteps: false,
      action: ({ environmentUuid }: dropdownMenuPayload) => {
        this.environmentsService.closeEnvironment(environmentUuid).subscribe();
      }
    }
  ];
  public cloudEnvironmentDropdownMenuItems: DropdownMenuItem[] = [
    ...this.commonDropdownMenuItems,
    ...(this.isWeb
      ? []
      : [
          {
            label: 'Show local backup data file in explorer/finder',
            icon: 'folder',
            twoSteps: false,
            action: ({ environmentUuid }: dropdownMenuPayload) => {
              this.environmentsService.showEnvironmentFileInFolder(
                environmentUuid
              );
            }
          },
          {
            label: 'Delete from cloud and convert to local',
            icon: 'cloud_remove',
            twoSteps: false,
            disabled$: () =>
              this.store.select('sync').pipe(map((sync) => !sync.status)),
            action: ({ environmentUuid }: dropdownMenuPayload) => {
              this.environmentsService
                .convertCloudToLocal(environmentUuid)
                .subscribe();
            }
          }
        ]),
    {
      label: this.isWeb ? 'Delete' : 'Delete from cloud and close',
      icon: this.isWeb ? 'delete' : 'cloud_remove',
      twoSteps: false,
      disabled$: () =>
        this.store.select('sync').pipe(map((sync) => !sync.status)),
      action: ({ environmentUuid }: dropdownMenuPayload) => {
        this.environmentsService.deleteFromCloud(environmentUuid).subscribe();
      }
    }
  ];
  public instances$ = this.store.select('deployInstances').pipe(
    map((deployInstances) =>
      deployInstances.reduce((instances, instance) => {
        instances[instance.environmentUuid] = instance;

        return instances;
      }, {})
    )
  );
  public cloudDropdownMenuItems: DropdownMenuElement[] = [
    {
      label: 'New cloud environment',
      icon: 'cloud_add',
      twoSteps: false,
      action: () => {
        this.environmentsService.addCloudEnvironment(null, true).subscribe();
      },
      disabled$: () => this.sync$.pipe(map((sync) => !sync?.status))
    },
    {
      label: 'New cloud environment from local file',
      icon: 'folder_open',
      twoSteps: false,
      action: () => {
        this.environmentsService.addCloudEnvironmentFromLocalFile().subscribe();
      },
      disabled$: () => this.sync$.pipe(map((sync) => !sync?.status))
    }
  ];
  public localDropdownMenuItems$: Observable<DropdownMenuElement[]>;
  public offlineReasonsLabels = {
    [SyncErrors.TOO_MANY_DEVICES]: 'too many devices connected.',
    [SyncErrors.VERSION_TOO_OLD]:
      'your Mockoon version is too old, please update.',
    [SyncDisconnectReasons.ROOM_INCOMPATIBLE_VERSION]:
      'your sync space was updated and is not compatible with your current version of Mockoon, please update.'
  };
  private localDropdownMenuStaticItems: DropdownMenuElement[] = [
    {
      label: 'New local environment',
      icon: 'note_add',
      twoSteps: false,
      action: () => {
        this.environmentsService
          .addEnvironment({ setActive: true })
          .subscribe();
      }
    },
    {
      label: 'Open local environment',
      icon: 'folder_open',
      twoSteps: false,
      action: () => {
        this.environmentsService.openEnvironment().subscribe();
      }
    },
    {
      separator: true
    }
  ];
  private userAndSync$ = combineLatest([
    this.store.select('user').pipe(distinctUntilChanged()),
    this.store.select('sync').pipe(distinctUntilChanged())
  ]);
  private categories: {
    id: EnvironmentsCategories;
    label: string;
    collapsed: boolean;
  }[];
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private environmentsService: EnvironmentsService,
    private store: Store,
    private eventsService: EventsService,
    private settingsService: SettingsService,
    private syncsService: SyncService,
    private uiService: UIService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.settings$ = this.store
      .select('settings')
      .pipe(filter(Boolean), distinctUntilChanged());
    this.localDropdownMenuItems$ = this.settings$.pipe(
      map((settings) => settings.recentLocalEnvironments),
      map((recentLocalEnvironments) => {
        const recentLocalEnvironmentsMenuItems =
          recentLocalEnvironments.map<DropdownMenuElement>(
            (recentLocalEnvironment: RecentLocalEnvironment) => ({
              label: recentLocalEnvironment.name,
              subLabel: recentLocalEnvironment.path,
              icon: null,
              twoSteps: false,
              action: () => {
                this.environmentsService
                  .openEnvironment(recentLocalEnvironment.path)
                  .subscribe();
              }
            })
          );

        return [
          ...this.localDropdownMenuStaticItems,
          ...recentLocalEnvironmentsMenuItems,
          ...(recentLocalEnvironmentsMenuItems.length > 0
            ? []
            : [
                {
                  label: 'No recent local environments',
                  icon: null,
                  twoSteps: false,
                  disabled$: () => of(true)
                }
              ]),
          {
            separator: true
          },
          {
            label: 'Clear recently opened',
            icon: 'delete',
            twoSteps: true,
            confirmIcon: 'delete',
            confirmLabel: 'Confirm',
            action: () => {
              this.settingsService.updateSettings({
                recentLocalEnvironments: []
              });
            }
          }
        ];
      })
    );
    this.activeEnvironment$ = this.store
      .selectActiveEnvironment()
      .pipe(filter((environment) => !!environment));
    this.environments$ = combineLatest([
      this.store.select('environments'),
      this.settings$
    ]).pipe(
      map(([environments, settings]) =>
        environments.filter((environment) =>
          settings.environments.find(
            (settingEnvironment) =>
              settingEnvironment.uuid === environment.uuid &&
              !settingEnvironment.cloud
          )
        )
      )
    );
    this.cloudEnvironments$ = combineLatest([
      this.store.select('environments').pipe(distinctUntilChanged()),
      this.settings$
    ]).pipe(
      map(([environments, settings]) =>
        environments.filter((environment) =>
          settings.environments.find(
            (settingEnvironment) =>
              settingEnvironment.uuid === environment.uuid &&
              settingEnvironment.cloud
          )
        )
      )
    );
    this.environmentsStatus$ = this.store.select('environmentsStatus');
    this.categories$ = this.settings$.pipe(
      map((settings) => {
        const sortedCategories = this.categories.sort(
          (itemA, itemB) =>
            settings.environmentsCategoriesOrder.indexOf(itemA.id) -
            settings.environmentsCategoriesOrder.indexOf(itemB.id)
        );

        return sortedCategories.map((category) => ({
          ...category,
          collapsed: settings.environmentsCategoriesCollapsed[category.id]
        }));
      })
    );
    this.syncAlert$ = combineLatest([
      this.cloudEnvironments$,
      this.userAndSync$
    ]).pipe(
      map(([cloudEnvironments, [user, sync]]) => {
        // if we have an alert from the server, display it
        if (sync.alert) {
          return sync.alert;
        }

        // if we have cloud environments and the sync is not running, display a warning to inform about offline mode
        if (cloudEnvironments.length > 0 && !sync.status) {
          return `OFFLINE_WARNING${
            user && user.plan !== 'FREE'
              ? user.plan === Plans.SOLO
                ? '_SOLO'
                : '_GROUP'
              : ''
          }`;
        }

        return null;
      })
    );
    this.isCloudEnabled$ = this.user$.pipe(
      map((user) => user && user.plan !== 'FREE')
    );

    this.categories = [
      {
        id: 'cloud',
        label: this.isWeb ? 'APIs' : 'Cloud',
        collapsed: false
      }
    ];

    if (!this.isWeb) {
      this.categories.push({
        id: 'local',
        label: 'Local',
        collapsed: false
      });
    }

    this.instanceUrls$ = combineLatest([
      this.store.select('environments'),
      this.store.select('deployInstances')
    ]).pipe(
      map(([environments, deployInstances]) => {
        return environments.reduce((instanceUrls, environment) => {
          const instance = deployInstances.find(
            (deployInstance) =>
              deployInstance.environmentUuid === environment.uuid
          );

          instanceUrls[environment.uuid] = buildApiUrl({
            environment,
            instance
          });

          return instanceUrls;
        }, {});
      })
    );

    this.initForms();
    this.initFormValues();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public enableDrag(enable: boolean) {
    this.dragEnabled = enable;
  }

  /**
   * Callback called when reordering environments
   *
   * @param reorderAction
   */
  public reorganizeEnvironments(reorderAction: ReorderAction) {
    this.environmentsService.reorderItems(
      reorderAction as ReorderAction<string>,
      ReorderableContainers.ENVIRONMENTS
    );
  }

  /**
   * Callback called when reordering environments categories
   *
   * @param reorderAction
   */
  public reorganizeEnvironmentsCategories(reorderAction: ReorderAction) {
    this.settingsService.reorganizeEnvironmentsCategories(
      reorderAction as ReorderAction<string>
    );
  }

  /**
   * Mark a category as collapsed and update the settings
   *
   * @param categoryId
   * @param collapsed
   */
  public collapseCategory(
    categoryId: EnvironmentsCategories,
    collapsed: boolean
  ) {
    this.settingsService.updateSettings({
      environmentsCategoriesCollapsed: {
        ...this.store.get('settings').environmentsCategoriesCollapsed,
        [categoryId]: !collapsed
      }
    });
  }

  /**
   * Select the active environment
   */
  public selectEnvironment(environmentUUID: string) {
    this.environmentsService.setActiveEnvironment(environmentUUID);
  }

  public cloudReconnect() {
    this.syncsService.reconnect();
  }

  public login(event: MouseEvent) {
    event.preventDefault();

    this.userService.startLoginFlow();
  }

  public openManageInstancesModal() {
    this.uiService.openModal('manageInstances', { refresh: true });
  }

  public addCloudEnvironment() {
    this.environmentsService.addCloudEnvironment(null, true).subscribe();
  }

  public copyUrlToClipboard(
    environment: Environment,
    instance: DeployInstance,
    urlName: 'webUrl' | 'localUrl',
    event: MouseEvent
  ) {
    event.stopPropagation();

    const urls = buildApiUrl({
      environment,
      instance,
      includeProtocol: true,
      includePrefix: true
    });

    navigator.clipboard.writeText(urls[urlName]);
  }

  /**
   * Init active environment form and subscribe to changes
   */
  private initForms() {
    this.activeEnvironmentForm = this.formBuilder.group({
      name: new UntypedFormControl('')
    });

    // send new activeEnvironmentForm values to the store, one by one
    merge(
      ...Object.keys(this.activeEnvironmentForm.controls).map((controlName) =>
        this.activeEnvironmentForm.get(controlName).valueChanges.pipe(
          map((newValue) => ({
            [controlName]: newValue
          }))
        )
      )
    )
      .pipe(
        tap((newProperty) => {
          this.environmentsService.updateActiveEnvironment(newProperty, true);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Listen to stores to init form values
   */
  private initFormValues() {
    // subscribe to active environment changes to reset the form
    this.activeEnvironment$
      .pipe(
        filter((environment) => !!environment),
        distinctUntilKeyChanged('uuid'),
        tap((activeEnvironment) => {
          this.activeEnvironmentForm.setValue(
            {
              name: activeEnvironment.name
            },
            { emitEvent: false }
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
}
