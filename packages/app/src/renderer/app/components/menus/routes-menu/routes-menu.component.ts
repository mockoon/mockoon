import { AsyncPipe, NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup
} from '@angular/forms';
import { DeployInstance } from '@mockoon/cloud';
import {
  Environment,
  Environments,
  Folder,
  FolderChild,
  ReorderAction,
  ReorderableContainers,
  ResponseMode,
  Route
} from '@mockoon/commons';
import {
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbPopover,
  NgbTooltip
} from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Observable, combineLatest, merge } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  tap,
  withLatestFrom
} from 'rxjs/operators';
import {
  DropdownMenuComponent,
  DropdownMenuItem
} from 'src/renderer/app/components/dropdown-menu/dropdown-menu.component';
import { EditableElementComponent } from 'src/renderer/app/components/editable-element/editable-element.component';
import { FilterComponent } from 'src/renderer/app/components/filter/filter.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { DraggableDirective } from 'src/renderer/app/directives/draggable.directive';
import { DropzoneDirective } from 'src/renderer/app/directives/dropzone.directive';
import { ResizeColumnDirective } from 'src/renderer/app/directives/resize-column.directive';
import { ScrollWhenActiveDirective } from 'src/renderer/app/directives/scroll-to-active.directive';
import { TourStepDirective } from 'src/renderer/app/directives/tour-step.directive';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { buildFullPath, textFilter } from 'src/renderer/app/libs/utils.lib';
import {
  DuplicatedRoutesTypes,
  EnvironmentsStatuses
} from 'src/renderer/app/models/store.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { Settings } from 'src/shared/models/settings.model';

type FullFolder = {
  uuid: string;
  name: string;
  children: (
    | { type: 'folder'; data: Folder }
    // routes has an extra property isHidden$ that is an observable of the route visibility based on the search filter (thus we avoid using a function in the template)
    | { type: 'route'; isHidden$: Observable<boolean>; data: Route }
  )[];
};

type routeDropdownMenuPayload = { parentId: string; routeUuid: string };
type folderDropdownMenuPayload = { folder: Folder; folderUuid: string };

@Component({
  selector: 'app-routes-menu',
  templateUrl: './routes-menu.component.html',
  styleUrls: ['./routes-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgbPopover,
    TourStepDirective,
    NgbDropdown,
    NgbDropdownToggle,
    SvgComponent,
    NgbDropdownMenu,
    FilterComponent,
    NgTemplateOutlet,
    ResizeColumnDirective,
    DraggableDirective,
    DropzoneDirective,
    ScrollWhenActiveDirective,
    FormsModule,
    ReactiveFormsModule,
    EditableElementComponent,
    DropdownMenuComponent,
    NgbTooltip,
    AsyncPipe,
    UpperCasePipe
  ]
})
export class RoutesMenuComponent {
  private environmentsService = inject(EnvironmentsService);
  private store = inject(Store);
  private uiService = inject(UIService);
  private formBuilder = inject(UntypedFormBuilder);
  private mainApiService = inject(MainApiService);
  private routesMenu = viewChild<ElementRef<HTMLUListElement>>('routesMenu');
  public settings$: Observable<Settings>;
  public activeEnvironment$: Observable<Environment>;
  public isActiveEnvironmentCloud$ = this.store.selectIsActiveEnvCloud();
  public environments$: Observable<Environments> =
    this.store.select('environments');
  public rootFolder$: Observable<FullFolder>;
  public activeRoute$: Observable<Route>;
  public environmentsStatus$: Observable<EnvironmentsStatuses>;
  public duplicatedRoutes$: Observable<DuplicatedRoutesTypes>;
  public disabledRoutes$: Observable<string[]>;
  public collapsedFolders$: Observable<string[]>;
  public routesFilter$: Observable<string>;
  public isActiveEnvironmentEditable$ =
    this.store.selectIsActiveEnvironmentEditable();
  private manualDragEnabled$ = new BehaviorSubject(true);
  public dragEnabled$ = combineLatest([
    this.isActiveEnvironmentEditable$,
    this.manualDragEnabled$
  ]).pipe(
    map(([isEditable, manualDragEnabled]) => isEditable && manualDragEnabled)
  );
  public focusableInputs = FocusableInputs;
  public folderForm: UntypedFormGroup;
  public menuSize = Config.defaultSecondaryMenuSize;
  public draggedFolderCollapsed: boolean;
  public ResponseMode = ResponseMode;
  public isWeb = Config.isWeb;
  // Multi-selection state for batch actions (local UI state).
  // A route is "selected" when present in this set; it is independent of the
  // "active" route (the one whose editor is shown on the right).
  public selectedRoutes$ = new BehaviorSubject<string[]>([]);
  // Tracks the last route clicked for shift-range selection support.
  private lastClickedRouteUuid: string | null = null;
  // Flat ordered list of visible (non-hidden) route uuids, used for shift-range.
  // Rebuilt whenever the routes/folders structure changes.
  private orderedRouteUuids: string[] = [];
  // Map of routeUuid -> parentId (folder uuid or 'root'), used by batch duplicate.
  private routeParentMap = new Map<string, string>();
  public routeDropdownMenuItems: DropdownMenuItem[] = [
    {
      label: 'Duplicate',
      icon: 'content_copy',
      twoSteps: false,
      disabled$: () =>
        this.store
          .selectIsActiveEnvironmentEditable()
          .pipe(map((isEditable) => !isEditable)),
      action: ({ parentId, routeUuid }: routeDropdownMenuPayload) => {
        this.environmentsService.duplicateRoute(parentId, routeUuid);
      }
    },
    {
      label: 'Duplicate to environment',
      icon: 'input',
      twoSteps: false,
      disabled$: () =>
        this.environments$.pipe(map((environments) => environments.length < 2)),
      action: ({ routeUuid }: routeDropdownMenuPayload) => {
        this.environmentsService.startEntityDuplicationToAnotherEnvironment(
          'route',
          [routeUuid]
        );
      }
    },
    {
      label: "Copy configuration to clipboard (Mockoon's JSON format)",
      icon: 'assignment',
      twoSteps: false,
      action: ({ routeUuid }: routeDropdownMenuPayload) => {
        this.environmentsService.copyRouteToClipboard(routeUuid);
      }
    },
    {
      label: 'Copy full path to clipboard',
      icon: 'assignment',
      twoSteps: false,
      action: ({ routeUuid }: routeDropdownMenuPayload) => {
        const activeEnvironment = this.store.getActiveEnvironment();
        const route = this.store.getRouteByUUID(routeUuid);

        let activeInstance: DeployInstance;

        if (this.isWeb) {
          activeInstance = this.store
            .get('deployInstances')
            .find(
              (instance) => instance.environmentUuid === activeEnvironment.uuid
            );
        }

        this.mainApiService.send(
          'APP_WRITE_CLIPBOARD',
          buildFullPath(activeEnvironment, route, activeInstance)
        );
      }
    },
    ...(this.isWeb
      ? []
      : [
          {
            label: 'Toggle',
            icon: 'power_settings_new',
            twoSteps: false,
            action: ({ routeUuid }: routeDropdownMenuPayload) => {
              this.environmentsService.toggleRoute(routeUuid);
            }
          }
        ]),
    {
      label: 'Delete',
      icon: 'delete',
      confirmIcon: 'error',
      confirmLabel: 'Confirm deletion',
      twoSteps: true,
      disabled$: () =>
        this.store
          .selectIsActiveEnvironmentEditable()
          .pipe(map((isEditable) => !isEditable)),
      action: ({ routeUuid }: routeDropdownMenuPayload) => {
        this.environmentsService.removeRoute(routeUuid);
      }
    }
  ];
  public folderDropdownMenuItems: DropdownMenuItem[] = [
    {
      label: 'Add CRUD route',
      icon: 'endpoints',
      twoSteps: false,
      disabled$: () =>
        this.store
          .selectIsActiveEnvironmentEditable()
          .pipe(map((isEditable) => !isEditable)),
      action: ({ folderUuid }: folderDropdownMenuPayload) => {
        this.environmentsService.addCRUDRoute(folderUuid);
      }
    },
    {
      label: 'Add HTTP route',
      icon: 'endpoint',
      twoSteps: false,
      disabled$: () =>
        this.store
          .selectIsActiveEnvironmentEditable()
          .pipe(map((isEditable) => !isEditable)),
      action: ({ folderUuid }: folderDropdownMenuPayload) => {
        this.environmentsService.addHTTPRoute(folderUuid);
      }
    },
    {
      label: 'Add folder',
      icon: 'folder',
      twoSteps: false,
      disabled$: () =>
        this.store
          .selectIsActiveEnvironmentEditable()
          .pipe(map((isEditable) => !isEditable)),
      action: ({ folderUuid }: folderDropdownMenuPayload) => {
        this.environmentsService.addFolder(folderUuid);
      }
    },
    ...(this.isWeb
      ? []
      : [
          {
            label: 'Toggle direct child routes',
            icon: 'power_settings_new',
            twoSteps: false,
            action: ({ folderUuid }: folderDropdownMenuPayload) => {
              this.environmentsService.toggleFolder(folderUuid);
            }
          }
        ]),
    {
      label: 'Delete folder',
      icon: 'delete',
      twoSteps: true,
      confirmIcon: 'error',
      confirmLabel: 'Confirm deletion',
      disabled$: ({ folder }: folderDropdownMenuPayload) =>
        this.store
          .selectIsActiveEnvironmentEditable()
          .pipe(map((isEditable) => !isEditable || folder.children.length > 0)),
      disabledLabel$: () =>
        this.store
          .selectIsActiveEnvironmentEditable()
          .pipe(
            map((isEditable) =>
              !isEditable ? 'Delete folder' : 'Delete folder (not empty)'
            )
          ),

      action: ({ folderUuid }: folderDropdownMenuPayload) => {
        this.environmentsService.removeFolder(folderUuid);
      }
    }
  ];

  constructor() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.activeRoute$ = this.store.selectActiveRoute();
    this.duplicatedRoutes$ = this.store.select('duplicatedRoutes');
    this.environmentsStatus$ = this.store.select('environmentsStatus');
    this.settings$ = this.store.select('settings');
    this.routesFilter$ = this.store.selectFilter('routes');
    this.disabledRoutes$ = this.store.selectActiveEnvironment().pipe(
      withLatestFrom(this.store.select('settings')),
      filter(
        ([activeEnvironment, settings]) => !!activeEnvironment && !!settings
      ),
      map(([activeEnvironment, settings]) => {
        return settings.disabledRoutes?.[activeEnvironment.uuid] || [];
      })
    );
    this.collapsedFolders$ = this.store.selectActiveEnvironment().pipe(
      withLatestFrom(this.store.select('settings')),
      filter(
        ([activeEnvironment, settings]) => !!activeEnvironment && !!settings
      ),
      map(([activeEnvironment, settings]) => {
        return settings.collapsedFolders?.[activeEnvironment.uuid] || [];
      })
    );

    this.rootFolder$ = this.store.selectActiveEnvironment().pipe(
      filter((activeEnvironment) => !!activeEnvironment),
      distinctUntilChanged(),
      map((activeEnvironment) => {
        // Reset selection-support indices for the new structure.
        this.routeParentMap.clear();
        this.orderedRouteUuids = [];

        const rootFolder = this.prepareFolders(
          activeEnvironment.rootChildren,
          [...activeEnvironment.folders, ...activeEnvironment.routes],
          'root'
        );

        // Drop any previously-selected uuids that no longer exist.
        const currentSelection = this.selectedRoutes$.value;
        if (currentSelection.length > 0) {
          const stillExisting = currentSelection.filter((uuid) =>
            this.routeParentMap.has(uuid)
          );
          if (stillExisting.length !== currentSelection.length) {
            this.selectedRoutes$.next(stillExisting);
          }
        }

        return {
          uuid: 'root',
          name: 'root',
          children: rootFolder.children
        };
      })
    );

    this.folderForm = this.formBuilder.group({
      uuid: [''],
      name: ['']
    });

    // send new activeRouteForm values to the store, one by one
    merge(
      ...Object.keys(this.folderForm.controls).map((controlName) =>
        this.folderForm
          .get(controlName)
          .valueChanges.pipe(map((newValue) => ({ [controlName]: newValue })))
      )
    )
      .pipe(
        tap((newFolderProperties: Partial<Folder>) => {
          this.environmentsService.updateFolder(
            this.folderForm.get('uuid').value,
            newFolderProperties
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe();

    this.store
      .selectIsActiveEnvironmentEditable()
      .pipe(
        tap((isEditable) => {
          if (isEditable) {
            this.folderForm.enable({ emitEvent: false });
          } else {
            this.folderForm.disable({ emitEvent: false });
          }
        }),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  /**
   * check if the route is hidden by the search filter
   *
   * @param search
   * @param route
   * @returns
   */
  public isRouteHidden(search: string, route: Route) {
    return !`${route.method} ${route.endpoint} ${route.documentation}`
      .toLowerCase()
      .includes(search.toLowerCase());
  }

  /**
   * Callback called when reordering routes and folders
   *
   * @param reorderAction
   */
  public reorderRoutes(reorderAction: ReorderAction) {
    this.environmentsService.reorderItems(
      reorderAction as ReorderAction<string>,
      ReorderableContainers.ROUTES
    );
  }

  /**
   * Create a new route in the current environment. Append at the end of the list
   */
  public addCRUDRoute() {
    this.environmentsService.addCRUDRoute('root');
  }

  /**
   * Generate a new template
   */
  public addCRUDRouteTemplate() {
    this.uiService.openModal('templates');
  }

  /**
   * Create a new route in the current environment. Append at the end of the list
   */
  public addHTTPRoute() {
    this.environmentsService.addHTTPRoute('root');
  }

  /**
   * Create a new route in the current environment. Append at the end of the list
   */
  public addWebSocketRoute() {
    this.environmentsService.addWebSocketRoute('root');
  }

  /**
   * Create a new folder in the current environment
   */
  public addFolder() {
    this.environmentsService.addFolder('root');

    // manually scroll to the bottom when adding a new folder as they cannot use the scrollWhenActive directive
    this.uiService.scrollToBottom(this.routesMenu().nativeElement);
  }

  /**
   * Select a route by UUID.
   *
   * - Plain click: clears multi-selection and sets the route as active (default).
   * - Ctrl/Cmd+click: toggles the route in the multi-selection set, without
   *   changing the active route.
   * - Shift+click: selects the range between the last clicked route and the
   *   current one (based on the visible flat order), without changing the
   *   active route.
   */
  public selectRoute(routeUUID: string, event?: MouseEvent) {
    if (event && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.toggleRouteSelection(routeUUID);
      this.lastClickedRouteUuid = routeUUID;

      return;
    }

    if (event?.shiftKey) {
      event.preventDefault();
      this.selectRouteRange(routeUUID);
      this.lastClickedRouteUuid = routeUUID;

      return;
    }

    // Default click: collapse multi-selection and activate the route.
    if (this.selectedRoutes$.value.length > 0) {
      this.selectedRoutes$.next([]);
      this.resetBatchDeleteConfirm();
    }
    this.lastClickedRouteUuid = routeUUID;
    this.environmentsService.setActiveRoute(routeUUID);
  }

  /**
   * Add or remove a route from the multi-selection set.
   */
  public toggleRouteSelection(routeUUID: string) {
    const current = this.selectedRoutes$.value;
    const next = current.includes(routeUUID)
      ? current.filter((uuid) => uuid !== routeUUID)
      : [...current, routeUUID];
    this.selectedRoutes$.next(next);
    this.resetBatchDeleteConfirm();
  }

  /**
   * Select all routes between the last clicked route and the provided one
   * (inclusive) using the visible flat order.
   */
  private selectRouteRange(routeUUID: string) {
    const ordered = this.orderedRouteUuids;
    const anchorUuid = this.lastClickedRouteUuid ?? routeUUID;
    const startIdx = ordered.indexOf(anchorUuid);
    const endIdx = ordered.indexOf(routeUUID);

    if (startIdx === -1 || endIdx === -1) {
      // Fallback: just toggle.
      this.toggleRouteSelection(routeUUID);

      return;
    }

    const [from, to] =
      startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    const range = ordered.slice(from, to + 1);
    const merged = Array.from(
      new Set([...this.selectedRoutes$.value, ...range])
    );
    this.selectedRoutes$.next(merged);
    this.resetBatchDeleteConfirm();
  }

  /**
   * Clear the multi-selection.
   */
  public clearSelection() {
    if (this.selectedRoutes$.value.length === 0) {
      return;
    }
    this.selectedRoutes$.next([]);
    this.resetBatchDeleteConfirm();
  }

  /**
   * Duplicate every selected route in place, in its containing folder.
   */
  public batchDuplicate() {
    const selection = this.selectedRoutes$.value;

    for (const routeUuid of selection) {
      const parentId = this.routeParentMap.get(routeUuid) ?? 'root';
      this.environmentsService.duplicateRoute(parentId, routeUuid);
    }
  }

  /**
   * Duplicate every selected route to another environment. Opens the existing
   * duplicate-to-environment modal, which will iterate the list once the user
   * picks a target environment.
   */
  public batchDuplicateToEnvironment() {
    const selection = this.selectedRoutes$.value;
    if (selection.length === 0) {
      return;
    }

    this.environmentsService.startEntityDuplicationToAnotherEnvironment(
      'route',
      [...selection]
    );
  }

  /**
   * Toggle (enable/disable) every selected route.
   */
  public batchToggle() {
    for (const routeUuid of this.selectedRoutes$.value) {
      this.environmentsService.toggleRoute(routeUuid);
    }
  }

  /**
   * Two-step batch delete: first click arms a confirmation state, second
   * click within a short window actually deletes. Mirrors the
   * dropdown-menu two-step pattern used elsewhere in the app.
   */
  public batchDeleteConfirming$ = new BehaviorSubject<boolean>(false);
  private batchDeleteConfirmTimeout: ReturnType<typeof setTimeout> | null =
    null;

  public batchDelete() {
    if (!this.batchDeleteConfirming$.value) {
      this.batchDeleteConfirming$.next(true);
      this.batchDeleteConfirmTimeout = setTimeout(() => {
        this.batchDeleteConfirming$.next(false);
        this.batchDeleteConfirmTimeout = null;
      }, 4000);

      return;
    }

    this.resetBatchDeleteConfirm();
    const selection = [...this.selectedRoutes$.value];
    this.selectedRoutes$.next([]);

    for (const routeUuid of selection) {
      this.environmentsService.removeRoute(routeUuid);
    }
  }

  private resetBatchDeleteConfirm() {
    if (this.batchDeleteConfirmTimeout) {
      clearTimeout(this.batchDeleteConfirmTimeout);
      this.batchDeleteConfirmTimeout = null;
    }
    if (this.batchDeleteConfirming$.value) {
      this.batchDeleteConfirming$.next(false);
    }
  }

  /**
   * Escape clears the current multi-selection.
   */
  @HostListener('document:keydown.escape')
  public onEscape() {
    this.clearSelection();
  }

  public toggleCollapse(folder: Folder) {
    this.environmentsService.toggleFolderCollapse(folder.uuid);
  }

  public editFolder(folder: Folder, editing: boolean) {
    if (editing) {
      this.manualDragEnabled$.next(false);

      this.folderForm.setValue(
        {
          uuid: folder.uuid,
          name: folder.name
        },
        { emitEvent: false }
      );
    } else {
      this.manualDragEnabled$.next(true);
    }
  }

  /**
   * Create an observable that will emit true if the route should be hidden by the search filter
   *
   * @param search
   * @param route
   * @returns
   */
  private createRouteHiddenObservable(route: Route) {
    return this.routesFilter$.pipe(
      debounceTime(100),
      map(
        (search) =>
          !textFilter(
            `${route.type} ${route.method} /${route.endpoint} ${route.documentation}`,
            search
          )
      )
    );
  }

  /**
   * Fill the folders objects with real sub folders and routes objects
   *
   * @param children
   * @param foldersAndRoutes
   * @returns
   */
  private prepareFolders(
    children: FolderChild[],
    foldersAndRoutes: (Folder | Route)[],
    parentId: string
  ): {
    children: (
      | { type: 'folder'; data: Folder }
      | { type: 'route'; isHidden$: Observable<boolean>; data: Route }
    )[];
  } {
    return {
      children: children.map((child) => {
        const foundChild = foldersAndRoutes.find(
          (item) => item.uuid === child.uuid
        );

        if (child.type === 'folder') {
          return {
            type: 'folder',
            data: {
              ...(foundChild as Folder),
              ...(this.prepareFolders(
                (foundChild as Folder).children,
                foldersAndRoutes,
                (foundChild as Folder).uuid
              ) as unknown as Folder)
            }
          };
        } else {
          // Index parent + ordered flat list for selection support.
          this.routeParentMap.set(child.uuid, parentId);
          this.orderedRouteUuids.push(child.uuid);

          return {
            type: 'route',
            isHidden$: this.createRouteHiddenObservable(foundChild as Route),
            data: foundChild as Route
          };
        }
      })
    };
  }
}
