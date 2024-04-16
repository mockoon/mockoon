import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  Callback,
  Environment,
  ReorderAction,
  ReorderableContainers
} from '@mockoon/commons';
import { Observable } from 'rxjs';
import {
  combineLatestWith,
  distinctUntilChanged,
  filter,
  map
} from 'rxjs/operators';
import { CallbacksContextMenu } from 'src/renderer/app/components/context-menu/context-menus';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { textFilter, trackByUuid } from 'src/renderer/app/libs/utils.lib';
import { ContextMenuEvent } from 'src/renderer/app/models/context-menu.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { Settings } from 'src/shared/models/settings.model';

@Component({
  selector: 'app-callbacks-menu',
  templateUrl: './callbacks-menu.component.html',
  styleUrls: ['./callbacks-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CallbacksMenuComponent implements OnInit {
  public settings$: Observable<Settings>;
  public activeEnvironment$: Observable<Environment>;
  public callbackList$: Observable<Callback[]>;
  public activeCallback$: Observable<Callback>;
  public callbacksFilter$: Observable<string>;
  public focusableInputs = FocusableInputs;
  public menuSize = Config.defaultSecondaryMenuSize;
  public trackByUuid = trackByUuid;

  constructor(
    private environmentsService: EnvironmentsService,
    private store: Store,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.activeCallback$ = this.store.selectActiveCallback();
    this.settings$ = this.store.select('settings');
    this.callbacksFilter$ = this.store.selectFilter('callbacks');

    this.callbackList$ = this.store.selectActiveEnvironment().pipe(
      filter((activeEnvironment) => !!activeEnvironment),
      distinctUntilChanged(),
      combineLatestWith(this.callbacksFilter$),
      map(([activeEnvironment, search]) =>
        !search
          ? activeEnvironment.callbacks
          : activeEnvironment.callbacks.filter((callback) =>
              textFilter(`${callback.name} ${callback.documentation}`, search)
            )
      )
    );
  }

  /**
   * Callback called when reordering callbacks.
   *
   * @param reorderAction
   */
  public reorderCallbacks(reorderAction: ReorderAction) {
    this.environmentsService.reorderItems(
      reorderAction as ReorderAction<string>,
      ReorderableContainers.CALLBACKS
    );
  }

  /**
   * Create a new callback in the current environment. Append at the end of the list
   */
  public addCallback() {
    this.environmentsService.addCallback();
  }

  /**
   * Select a callback by UUID, or the first callback if no UUID is present
   */
  public selectCallback(callbackUUID: string) {
    this.environmentsService.setActiveCallback(callbackUUID);
  }

  /**
   * Show and position the context menu
   *
   * @param event - click event
   */
  public openContextMenu(callbackUUID: string, event: MouseEvent) {
    // if right click display context menu
    if (event && event.button === 2) {
      const menu: ContextMenuEvent = {
        event,
        items: CallbacksContextMenu(
          callbackUUID,
          this.store.get('environments')
        )
      };

      this.eventsService.contextMenuEvents.next(menu);
    }
  }
}
