import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup
} from '@angular/forms';
import {
  Environment,
  Folder,
  FolderChild,
  ResponseMode,
  Route
} from '@mockoon/commons';
import { Observable, Subject, from, merge } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators';
import {
  FoldersContextMenu,
  RoutesContextMenu
} from 'src/renderer/app/components/context-menu/context-menus';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { ContextMenuEvent } from 'src/renderer/app/models/context-menu.model';
import { DataSubject } from 'src/renderer/app/models/data.model';
import {
  DuplicatedRoutesTypes,
  EnvironmentsStatuses
} from 'src/renderer/app/models/store.model';
import {
  DraggableContainers,
  DropAction
} from 'src/renderer/app/models/ui.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { updateFilterAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { Settings } from 'src/shared/models/settings.model';

type FullFolder = {
  uuid: string;
  name: string;
  children: (
    | { type: 'folder'; data: Folder }
    | { type: 'route'; data: Route }
  )[];
};

@Component({
  selector: 'app-routes-menu',
  templateUrl: './routes-menu.component.html',
  styleUrls: ['./routes-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoutesMenuComponent implements OnInit, OnDestroy {
  @ViewChild('routesMenu')
  private routesMenu: ElementRef<HTMLUListElement>;
  public settings$: Observable<Settings>;
  public activeEnvironment$: Observable<Environment>;
  public rootFolder$: Observable<FullFolder>;
  public activeRoute$: Observable<Route>;
  public environmentsStatus$: Observable<EnvironmentsStatuses>;
  public duplicatedRoutes$: Observable<DuplicatedRoutesTypes>;
  public disabledRoutes$: Observable<string[]>;
  public collapsedFolders$: Observable<string[]>;
  public routesFilter$: Observable<string>;
  public routesFilter: UntypedFormControl;
  public dragEnabled = true;
  public focusableInputs = FocusableInputs;
  public folderForm: UntypedFormGroup;
  public os$: Observable<string>;
  public menuSize = Config.defaultSecondaryMenuSize;
  public draggedFolderCollapsed: boolean;
  public ResponseMode = ResponseMode;
  private destroy$ = new Subject<void>();

  constructor(
    private environmentsService: EnvironmentsService,
    private store: Store,
    private eventsService: EventsService,
    private uiService: UIService,
    private formBuilder: UntypedFormBuilder
  ) {}

  @HostListener('keydown', ['$event'])
  public escapeFilterInput(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.clearFilter();
    }
  }

  ngOnInit() {
    this.os$ = from(MainAPI.invoke('APP_GET_OS'));
    this.routesFilter = this.formBuilder.control('');

    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.activeRoute$ = this.store.selectActiveRoute();
    this.duplicatedRoutes$ = this.store.select('duplicatedRoutes');
    this.environmentsStatus$ = this.store.select('environmentsStatus');
    this.settings$ = this.store.select('settings');
    this.routesFilter$ = this.store.selectFilter('routes').pipe(
      tap((search) => {
        this.routesFilter.patchValue(search, { emitEvent: false });
      })
    );
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

    this.routesFilter.valueChanges
      .pipe(
        debounceTime(10),
        tap((search) =>
          this.store.update(updateFilterAction('routes', search))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.initForms();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  /**
   * Callback called when reordering routes and folders
   *
   * @param dropAction
   */
  public reorganizeRoutes(dropAction: DropAction) {
    this.environmentsService.reorganizeItems(
      dropAction,
      DraggableContainers.ROUTES
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

  /**
   * Show and position the context menu
   *
   * @param event - click event
   */
  public openContextMenu(
    subject: Exclude<DataSubject, 'databucket' | 'environment'>,
    subjectUUID: string,
    event: MouseEvent,
    parentId?: string
  ) {
    if (event?.button !== 2) {
      return;
    }

    let menu: ContextMenuEvent;

    if (subject === 'folder') {
      menu = {
        event,
        items: FoldersContextMenu(subjectUUID)
      };
    } else if (subject === 'route') {
      menu = {
        event,
        items: RoutesContextMenu(
          subjectUUID,
          parentId,
          this.store.get('environments')
        )
      };
    }
    this.eventsService.contextMenuEvents.next(menu);
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
   * Clear the filter route
   */
  public clearFilter() {
    this.store.update(updateFilterAction('routes', ''));
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
      | { type: 'route'; data: Route }
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
          return { type: 'route', data: foundChild as Route };
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
