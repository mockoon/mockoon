import { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { Environment, Route } from '@mockoon/commons';
import { combineLatest, from, Observable, Subscription } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  tap
} from 'rxjs/operators';
import { RoutesContextMenu } from 'src/renderer/app/components/context-menu/context-menus';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { ContextMenuEvent } from 'src/renderer/app/models/context-menu.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { updateEnvironmentroutesFilterAction } from 'src/renderer/app/stores/actions';
import {
  DuplicatedRoutesTypes,
  EnvironmentsStatuses,
  Store
} from 'src/renderer/app/stores/store';
import { Config } from 'src/shared/config';
import { Settings } from 'src/shared/models/settings.model';

@Component({
  selector: 'app-routes-menu',
  templateUrl: './routes-menu.component.html',
  styleUrls: ['./routes-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoutesMenuComponent implements OnInit, OnDestroy {
  @ViewChild('routesMenu') private routesMenu: ElementRef;
  public settings$: Observable<Settings>;
  public activeEnvironment$: Observable<Environment>;
  public routeList$: Observable<Route[]>;
  public activeRoute$: Observable<Route>;
  public environmentsStatus$: Observable<EnvironmentsStatuses>;
  public duplicatedRoutes$: Observable<DuplicatedRoutesTypes>;
  public routesFilter$: Observable<string>;
  public routesFilter: FormControl;
  public dragIsDisabled = false;
  public focusableInputs = FocusableInputs;
  public os$: Observable<string>;
  public menuSize = Config.defaultRouteMenuSize;
  private routesFilterSubscription: Subscription;

  constructor(
    private environmentsService: EnvironmentsService,
    private store: Store,
    private eventsService: EventsService,
    private uiService: UIService,
    private formBuilder: FormBuilder
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
    this.routesFilter$ = this.store.select('routesFilter');

    this.routeList$ = combineLatest([
      this.store.selectActiveEnvironment().pipe(
        filter((activeEnvironment) => !!activeEnvironment),
        distinctUntilChanged(),
        map((activeEnvironment) => activeEnvironment.routes)
      ),
      this.routesFilter$.pipe(
        tap((search) => {
          this.routesFilter.patchValue(search, { emitEvent: false });
        })
      )
    ]).pipe(
      map(([routes, search]) => {
        this.dragIsDisabled = search.length > 0;

        if (search.charAt(0) === '/') {
          search = search.substring(1);
        }

        return routes.filter(
          (route) =>
            route.endpoint.includes(search) ||
            route.documentation.includes(search)
        );
      })
    );

    this.uiService.scrollRoutesMenu.subscribe((scrollDirection) => {
      this.uiService.scroll(this.routesMenu.nativeElement, scrollDirection);
    });

    this.routesFilterSubscription = this.routesFilter.valueChanges
      .pipe(
        debounceTime(10),
        tap((search) =>
          this.store.update(updateEnvironmentroutesFilterAction(search))
        )
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.routesFilterSubscription.unsubscribe();
  }

  /**
   * Callback called when reordering routes
   *
   * @param event
   */
  public reorderRoutes(event: CdkDragDrop<string[]>) {
    this.environmentsService.moveMenuItem(
      'routes',
      event.previousIndex,
      event.currentIndex
    );
  }

  /**
   * Create a new route in the current environment. Append at the end of the list
   */
  public addRoute() {
    this.environmentsService.addRoute();

    if (this.routesMenu) {
      this.uiService.scrollToBottom(this.routesMenu.nativeElement);
    }
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
  public openContextMenu(routeUUID: string, event: MouseEvent) {
    // if right click display context menu
    if (event && event.button === 2) {
      const menu: ContextMenuEvent = {
        event,
        items: RoutesContextMenu(routeUUID, this.store.get('environments'))
      };

      this.eventsService.contextMenuEvents.next(menu);
    }
  }

  /**
   * Clear the filter route
   */
  public clearFilter() {
    this.store.update(updateEnvironmentroutesFilterAction(''));
  }
}
