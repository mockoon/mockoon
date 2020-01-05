import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { ContextMenuEvent, EventsService } from 'src/app/services/events.service';
import { UIService } from 'src/app/services/ui.service';
import { EnvironmentsStatuses, Store, UIState } from 'src/app/stores/store';
import { Environment, Environments } from 'src/app/types/environment.type';
import { ScrollDirection } from 'src/app/types/ui.type';
import { EnvironmentsContextMenu } from '../context-menu/context-menus';

@Component({
  selector: 'app-environments-menu',
  templateUrl: './environments-menu.component.html',
  styleUrls: ['./environments-menu.component.scss']
})
export class EnvironmentsMenuComponent implements OnInit {
  @ViewChild('environmentsMenu', { static: false })
  private environmentsMenu: ElementRef;

  public activeEnvironment$: Observable<Environment>;
  public environments$: Observable<Environments>;
  public environmentsStatus$: Observable<EnvironmentsStatuses>;
  public duplicatedEnvironments$: Observable<Set<string>>;
  public uiState$: Observable<UIState>;

  constructor(
    private environmentsService: EnvironmentsService,
    private store: Store,
    private eventsService: EventsService,
    private uiService: UIService
  ) {}

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.duplicatedEnvironments$ = this.store.select('duplicatedEnvironments');
    this.environments$ = this.store.select('environments');
    this.environmentsStatus$ = this.store.select('environmentsStatus');
    this.uiState$ = this.store.select('uiState');

    this.uiService.scrollEnvironmentsMenu.subscribe(scrollDirection => {
      this.uiService.scroll(
        this.environmentsMenu.nativeElement,
        scrollDirection
      );
    });
  }

  /**
   * Create a new environment. Append at the end of the list.
   */
  public addEnvironment() {
    this.environmentsService.addEnvironment();

    this.uiService.scrollToBottom(this.environmentsMenu.nativeElement);
  }

  public selectEnvironment(environmentUUID: string) {
    if (
      !this.store.getEnvironmentStatus()[environmentUUID]
        .disabledForIncompatibility
    ) {
      this.environmentsService.setActiveEnvironment(environmentUUID);

      this.uiService.scrollRoutesMenu.next(ScrollDirection.TOP);
    }
  }

  /**
   * Show and position the context menu
   *
   * @param event - click event
   */
  public openContextMenu(environmentUUID: string, event: MouseEvent) {
    // if right click display context menu
    if (
      event &&
      event.which === 3 &&
      !this.store.getEnvironmentStatus()[environmentUUID]
        .disabledForIncompatibility
    ) {
      const menu: ContextMenuEvent = {
        event: event,
        items: EnvironmentsContextMenu(environmentUUID)
      };

      this.eventsService.contextMenuEvents.emit(menu);
    }
  }

  /**
   * Toggle the environments menu
   */
  public toggleMenu() {
    const uiState = this.store.get('uiState');

    this.uiService.updateUIState({
      environmentsMenuOpened: !uiState.environmentsMenuOpened
    });
  }
}
