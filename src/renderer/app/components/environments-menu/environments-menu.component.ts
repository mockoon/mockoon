import { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';
import { Environment, Environments } from '@mockoon/commons';
import { Observable } from 'rxjs';
import { EnvironmentsContextMenu } from 'src/renderer/app/components/context-menu/context-menus';
import { ContextMenuEvent } from 'src/renderer/app/models/context-menu.model';
import { ScrollDirection } from 'src/renderer/app/models/ui.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { EnvironmentsStatuses, Store, UIState } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-environments-menu',
  templateUrl: './environments-menu.component.html',
  styleUrls: ['./environments-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnvironmentsMenuComponent implements OnInit {
  @ViewChild('environmentsMenu')
  private environmentsMenu: ElementRef;

  public activeEnvironment$: Observable<Environment>;
  public environments$: Observable<Environments>;
  public environmentsStatus$: Observable<EnvironmentsStatuses>;
  public duplicatedEnvironments$: Observable<Set<string>>;
  public uiState$: Observable<UIState>;
  private clickOnMenu = false;

  constructor(
    private environmentsService: EnvironmentsService,
    private store: Store,
    private eventsService: EventsService,
    private uiService: UIService
  ) {}

  /**
   * Detect clicks inside component to avoid closing
   * Used together with document:click listener
   */
  @HostListener('click')
  public clickInsideMenu() {
    this.clickOnMenu = true;
  }

  /**
   * Listen on document's click to close the menu if user click outside
   */
  @HostListener('document:click')
  public clickOutsideMenu() {
    if (!this.clickOnMenu) {
      this.closeIfOpen();
    }
    this.clickOnMenu = false;
  }

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.duplicatedEnvironments$ = this.store.select('duplicatedEnvironments');
    this.environments$ = this.store.select('environments');
    this.environmentsStatus$ = this.store.select('environmentsStatus');
    this.uiState$ = this.store.select('uiState');

    this.uiService.scrollEnvironmentsMenu.subscribe((scrollDirection) => {
      this.uiService.scroll(
        this.environmentsMenu.nativeElement,
        scrollDirection
      );
    });
  }

  /**
   * Callback called when reordering environments
   *
   * @param event
   */
  public reorderEnvironments(event: CdkDragDrop<string[]>) {
    this.environmentsService.moveMenuItem(
      'environments',
      event.previousIndex,
      event.currentIndex
    );
  }

  /**
   * Create a new environment. Append at the end of the list.
   */
  public addEnvironment() {
    this.environmentsService.addEnvironment();

    this.uiService.scrollToBottom(this.environmentsMenu.nativeElement);
  }

  /**
   * Select the active environment
   */
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
      event.button === 2 &&
      !this.store.getEnvironmentStatus()[environmentUUID]
        .disabledForIncompatibility
    ) {
      const menu: ContextMenuEvent = {
        event,
        items: EnvironmentsContextMenu(environmentUUID)
      };

      this.eventsService.contextMenuEvents.next(menu);
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

  /**
   * Close the environments menu if already opened
   */
  private closeIfOpen() {
    const uiState = this.store.get('uiState');

    if (uiState.environmentsMenuOpened) {
      this.uiService.updateUIState({ environmentsMenuOpened: false });
    }
  }
}
