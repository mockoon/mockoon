import { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { Environment, Environments } from '@mockoon/commons';
import { Observable } from 'rxjs';
import { EnvironmentsContextMenu } from 'src/renderer/app/components/context-menu/context-menus';
import { Config } from 'src/renderer/app/config';
import { ContextMenuEvent } from 'src/renderer/app/models/context-menu.model';
import { ScrollDirection } from 'src/renderer/app/models/ui.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { EnvironmentsStatuses, Store } from 'src/renderer/app/stores/store';

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
  public menuSize = Config.defaultEnvironmentMenuSize;

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
    this.environmentsService.addEnvironment().subscribe();

    this.uiService.scrollToBottom(this.environmentsMenu.nativeElement);
  }

  /**
   * Open an environment. Append at the end of the list.
   */
  public async openEnvironment() {
    this.environmentsService.openEnvironment().subscribe();
    this.uiService.scrollToBottom(this.environmentsMenu.nativeElement);
  }

  /**
   * Select the active environment
   */
  public selectEnvironment(environmentUUID: string) {
    this.environmentsService.setActiveEnvironment(environmentUUID);
    this.uiService.scrollRoutesMenu.next(ScrollDirection.TOP);
  }

  /**
   * Show and position the context menu
   *
   * @param event - click event
   */
  public openContextMenu(environmentUUID: string, event: MouseEvent) {
    // if right click display context menu
    if (event && event.button === 2) {
      const menu: ContextMenuEvent = {
        event,
        items: EnvironmentsContextMenu(environmentUUID)
      };

      this.eventsService.contextMenuEvents.next(menu);
    }
  }
}
