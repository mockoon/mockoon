import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { RoutesContextMenu } from 'src/app/components/context-menu/context-menus';
import { ContextMenuEvent } from 'src/app/models/context-menu.model';
import { Settings } from 'src/app/models/settings.model';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { EventsService } from 'src/app/services/events.service';
import { UIService } from 'src/app/services/ui.service';
import { DuplicatedRoutesTypes, EnvironmentsStatuses, Store } from 'src/app/stores/store';
import { Environment, Route } from '@mockoon/commons';

@Component({
  selector: 'app-routes-menu',
  templateUrl: './routes-menu.component.html',
  styleUrls: ['./routes-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoutesMenuComponent implements OnInit {
  @ViewChild('routesMenu', { static: false }) private routesMenu: ElementRef;
  public settings$: Observable<Settings>;
  public activeEnvironment$: Observable<Environment>;
  public activeRoute$: Observable<Route>;
  public environmentsStatus$: Observable<EnvironmentsStatuses>;
  public duplicatedRoutes$: Observable<DuplicatedRoutesTypes>;

  constructor(
    private environmentsService: EnvironmentsService,
    private store: Store,
    private eventsService: EventsService,
    private uiService: UIService
  ) {}

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.activeRoute$ = this.store.selectActiveRoute();
    this.duplicatedRoutes$ = this.store.select('duplicatedRoutes');
    this.environmentsStatus$ = this.store.select('environmentsStatus');
    this.settings$ = this.store.select('settings');

    this.uiService.scrollRoutesMenu.subscribe((scrollDirection) => {
      this.uiService.scroll(this.routesMenu.nativeElement, scrollDirection);
    });
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
    if (event && event.which === 3) {
      const menu: ContextMenuEvent = {
        event: event,
        items: RoutesContextMenu(routeUUID)
      };

      this.eventsService.contextMenuEvents.next(menu);
    }
  }
}
