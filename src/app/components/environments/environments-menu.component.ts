import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { DragulaService } from 'ng2-dragula';
import { dragulaNamespaces as DraggableContainerNames, Scroll } from 'src/app/types/ui.type.js';
import { ReducerDirectionType } from 'src/app/stores/reducer';
import { Observable } from 'rxjs';
import { EnvironmentsStatuses, Store } from 'src/app/stores/store';
import { Environments, Environment } from 'src/app/types/environment.type';
import { EventsService, ContextMenuEvent } from 'src/app/services/events.service';
import { EnvironmentsContextMenuItems } from './environments-context-menu-items';

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

  constructor(
    private environmentsService: EnvironmentsService,
    private dragulaService: DragulaService,
    private store: Store,
    private eventsService: EventsService,
  ) { }

  ngOnInit() {
    this.initDragMonitoring();

    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.environments$ = this.store.select('environments');
    this.environmentsStatus$ = this.store.select('environmentsStatus');
    this.duplicatedEnvironments$ = this.store.select('duplicatedEnvironments');
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

  private initDragMonitoring() {
    this.dragulaService.dropModel().subscribe(({name, sourceIndex, targetIndex}) => {
      this.environmentsService.moveMenuItem(
        name as DraggableContainerNames,
        sourceIndex,
        targetIndex
      );
    });
  }

  /**
  * Scroll to bottom of an element
  *
  * @param element
  */
 private scrollToBottom(element: Element) {
   setTimeout(() => element.scrollTop = element.scrollHeight);
 }
}
