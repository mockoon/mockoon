import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
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
import { Observable, Subject, merge, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators';
import { DropdownMenuItem } from 'src/renderer/app/components/dropdown-menu/dropdown-menu.component';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { BuildFullPath, textFilter } from 'src/renderer/app/libs/utils.lib';
import {
  DuplicatedRoutesTypes,
  EnvironmentsStatuses
} from 'src/renderer/app/models/store.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
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
  standalone: false
})
export class RoutesMenuComponent implements OnInit, OnDestroy {
  @ViewChild('routesMenu')
  private routesMenu: ElementRef<HTMLUListElement>;

  public settings$: Observable<Settings>;
  public activeEnvironment$: Observable<Environment>;
  public environments$: Observable<Environments> =
    this.store.select('environments');
  public rootFolder$: Observable<FullFolder>;
  public activeRoute$: Observable<Route>;
  public environmentsStatus$: Observable<EnvironmentsStatuses>;
  public duplicatedRoutes$: Observable<DuplicatedRoutesTypes>;
  public disabledRoutes$: Observable<string[]>;
  public collapsedFolders$: Observable<string[]>;
  public routesFilter$: Observable<string>;
  public dragEnabled = true;
  public focusableInputs = FocusableInputs;
  public folderForm: UntypedFormGroup;
  public menuSize = Config.defaultSecondaryMenuSize;
  public draggedFolderCollapsed: boolean;
  public ResponseMode = ResponseMode;
  public routeDropdownMenuItems: DropdownMenuItem[] = [
    {
      label: 'Duplicate',
      icon: 'content_copy',
      twoSteps: false,
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
          routeUuid,
          'route'
        );
      }
    },
    {
      label: 'Copy configuration to clipboard (JSON)',
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

        MainAPI.send(
          'APP_WRITE_CLIPBOARD',
          BuildFullPath(activeEnvironment, route)
        );
      }
    },
    {
      label: 'Toggle',
      icon: 'power_settings_new',
      twoSteps: false,
      action: ({ routeUuid }: routeDropdownMenuPayload) => {
        this.environmentsService.toggleRoute(routeUuid);
      }
    },
    {
      label: 'Delete',
      icon: 'delete',
      confirmIcon: 'error',
      confirmLabel: 'Confirm deletion',
      twoSteps: true,
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
      action: ({ folderUuid }: folderDropdownMenuPayload) => {
        this.environmentsService.addCRUDRoute(folderUuid);
      }
    },
    {
      label: 'Add HTTP route',
      icon: 'endpoint',
      twoSteps: false,
      action: ({ folderUuid }: folderDropdownMenuPayload) => {
        this.environmentsService.addHTTPRoute(folderUuid);
      }
    },
    {
      label: 'Add folder',
      icon: 'folder',
      twoSteps: false,
      action: ({ folderUuid }: folderDropdownMenuPayload) => {
        this.environmentsService.addFolder(folderUuid);
      }
    },
    {
      label: 'Toggle direct child routes',
      icon: 'power_settings_new',
      twoSteps: false,
      action: ({ folderUuid }: folderDropdownMenuPayload) => {
        this.environmentsService.toggleFolder(folderUuid);
      }
    },
    {
      label: 'Delete folder',
      icon: 'delete',
      twoSteps: true,
      confirmIcon: 'error',
      confirmLabel: 'Confirm deletion',
      disabled$: ({ folder }: folderDropdownMenuPayload) =>
        of(folder.children.length > 0),
      disabledLabel: 'Delete folder (not empty)',
      action: ({ folderUuid }: folderDropdownMenuPayload) => {
        this.environmentsService.removeFolder(folderUuid);
      }
    }
  ];
  private destroy$ = new Subject<void>();

  constructor(
    private environmentsService: EnvironmentsService,
    private store: Store,
    private uiService: UIService,
    private formBuilder: UntypedFormBuilder
  ) {}

  ngOnInit() {
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
        const rootFolder = this.prepareFolders(activeEnvironment.rootChildren, [
          ...activeEnvironment.folders,
          ...activeEnvironment.routes
        ]);

        return {
          uuid: 'root',
          name: 'root',
          children: rootFolder.children
        };
      })
    );

    this.initForms();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
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
    this.uiService.scrollToBottom(this.routesMenu.nativeElement);
  }

  public trackByUuid(index: number, child: { data: { uuid: string } }) {
    return child.data.uuid;
  }

  /**
   * Select a route by UUID, or the first route if no UUID is present
   */
  public selectRoute(routeUUID: string) {
    this.environmentsService.setActiveRoute(routeUUID);
  }

  public toggleCollapse(folder: Folder) {
    this.environmentsService.toggleFolderCollapse(folder.uuid);
  }

  public editFolder(folder: Folder, editing: boolean) {
    if (editing) {
      this.dragEnabled = false;

      this.folderForm.setValue(
        {
          uuid: folder.uuid,
          name: folder.name
        },
        { emitEvent: false }
      );
    } else {
      this.dragEnabled = true;
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
    foldersAndRoutes: (Folder | Route)[]
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
                foldersAndRoutes
              ) as unknown as Folder)
            }
          };
        } else {
          return {
            type: 'route',
            isHidden$: this.createRouteHiddenObservable(foundChild as Route),
            data: foundChild as Route
          };
        }
      })
    };
  }

  /**
   * Init forms and subscribe to changes
   */
  private initForms() {
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
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
}
