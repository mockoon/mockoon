import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  DataBucket,
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
import { DatabucketsContextMenu } from 'src/renderer/app/components/context-menu/context-menus';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { textFilter, trackByUuid } from 'src/renderer/app/libs/utils.lib';
import { ContextMenuEvent } from 'src/renderer/app/models/context-menu.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { Settings } from 'src/shared/models/settings.model';

@Component({
  selector: 'app-databuckets-menu',
  templateUrl: './databuckets-menu.component.html',
  styleUrls: ['./databuckets-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatabucketsMenuComponent implements OnInit {
  public settings$: Observable<Settings>;
  public activeEnvironment$: Observable<Environment>;
  public databucketList$: Observable<DataBucket[]>;
  public activeDatabucket$: Observable<DataBucket>;
  public databucketsFilter$: Observable<string>;
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
    this.activeDatabucket$ = this.store.selectActiveDatabucket();
    this.settings$ = this.store.select('settings');
    this.databucketsFilter$ = this.store.selectFilter('databuckets');

    this.databucketList$ = this.store.selectActiveEnvironment().pipe(
      filter((activeEnvironment) => !!activeEnvironment),
      distinctUntilChanged(),
      combineLatestWith(this.databucketsFilter$),
      map(([activeEnvironment, search]) =>
        !search
          ? activeEnvironment.data
          : activeEnvironment.data.filter((databucket) =>
              textFilter(
                `${databucket.name} ${databucket.documentation}`,
                search
              )
            )
      )
    );
  }

  /**
   * Callback called when reordering databuckets
   *
   * @param reorderAction
   */
  public reorganizeDatabuckets(reorderAction: ReorderAction) {
    this.environmentsService.reorderItems(
      reorderAction as ReorderAction<string>,
      ReorderableContainers.DATABUCKETS
    );
  }

  /**
   * Create a new databucket in the current environment. Append at the end of the list
   */
  public addDatabucket() {
    this.environmentsService.addDatabucket();
  }

  /**
   * Select a databucket by UUID, or the first databucket if no UUID is present
   */
  public selectDatabucket(databucketUUID: string) {
    this.environmentsService.setActiveDatabucket(databucketUUID);
  }

  /**
   * Show and position the context menu
   *
   * @param event - click event
   */
  public openContextMenu(databucketUUID: string, event: MouseEvent) {
    // if right click display context menu
    if (event && event.button === 2) {
      const menu: ContextMenuEvent = {
        event,
        items: DatabucketsContextMenu(
          databucketUUID,
          this.store.get('environments')
        )
      };

      this.eventsService.contextMenuEvents.next(menu);
    }
  }
}
