import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { DragulaService } from 'ng2-dragula';
import { Observable } from 'rxjs';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { ContextMenuEvent, EventsService } from 'src/app/services/events.service';
import { ReducerDirectionType } from 'src/app/stores/reducer';
import { EnvironmentsStatuses, Store } from 'src/app/stores/store';
import { Environment, Environments } from 'src/app/types/environment.type';
import { dragulaNamespaces as DraggableContainerNames, Scroll } from 'src/app/types/ui.type.js';
import { EnvironmentsContextMenuItems } from './environments-context-menu-items';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-environments-menu',
  templateUrl: './environments-menu.component.html',
  styleUrls: ['./environments-menu.component.scss']
})
export class EnvironmentsMenuComponent implements OnInit {
  @ViewChild('environmentsMenu', { static: false }) private environmentsMenu: ElementRef;
  @Output() scroll = new EventEmitter<Scroll>();

  public activeEnvironment$: Observable<Environment>;
  public environments$: Observable<Environments>;
  public environmentsStatus$: Observable<EnvironmentsStatuses>;
  public duplicatedEnvironments$: Observable<Set<string>>;

  public menuOpen: boolean;

  constructor(
    private environmentsService: EnvironmentsService,
    private dragulaService: DragulaService,
    private store: Store,
    private eventsService: EventsService
  ) {  }

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.duplicatedEnvironments$ = this.store.select('duplicatedEnvironments');
    this.environments$ = this.store.select('environments').pipe(
      tap(e => console.log(e))
    );
    this.environmentsStatus$ = this.store.select('environmentsStatus');
    this.menuOpen = this.store.get('environmentsMenuState');
  }

  /**
   * Create a new environment. Append at the end of the list.
   */
  public addEnvironment() {
    this.environmentsService.addEnvironment();

    this.scrollToBottom(this.environmentsMenu.nativeElement);
  }

  public selectEnvironment(environmentUUIDOrDirection: string | ReducerDirectionType) {
    this.environmentsService.setActiveEnvironment(environmentUUIDOrDirection);

    // scroll routesMenu to top when navigating environments
    this.scroll.emit({element: 'routesMenu', action: 'scrollTop', position: 0});
  }

  /**
   * Show and position the context menu
   *
   * @param event - click event
   */
  public navigationContextMenu(subjectUUID: string, event: any) {
    // if right click display context menu
    if (event && event.which === 3) {
      const menu: ContextMenuEvent = {
        event: event,
        items: EnvironmentsContextMenuItems(subjectUUID)
      };

      this.eventsService.contextMenuEvents.emit(menu);
    }
  }

  public toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.environmentsService.updateEnvironmentsMenuState(this.menuOpen);
  }

 private scrollToBottom(element: Element) {
   setTimeout(() => element.scrollTop = element.scrollHeight);
 }
}
