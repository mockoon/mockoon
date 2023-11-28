import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import {
  DataBucket,
  Environment,
  ReorderAction,
  ReorderableContainers
} from '@mockoon/commons';
import { Observable, Subject, from } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  takeUntil,
  tap
} from 'rxjs/operators';
import { DatabucketsContextMenu } from 'src/renderer/app/components/context-menu/context-menus';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { trackByUuid } from 'src/renderer/app/libs/utils.lib';
import { ContextMenuEvent } from 'src/renderer/app/models/context-menu.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { updateFilterAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { Settings } from 'src/shared/models/settings.model';

@Component({
  selector: 'app-databuckets-menu',
  templateUrl: './databuckets-menu.component.html',
  styleUrls: ['./databuckets-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatabucketsMenuComponent implements OnInit, OnDestroy {
  public settings$: Observable<Settings>;
  public activeEnvironment$: Observable<Environment>;
  public databucketList$: Observable<DataBucket[]>;
  public activeDatabucket$: Observable<DataBucket>;
  public databucketsFilter$: Observable<string>;
  public databucketsFilter: UntypedFormControl;
  public focusableInputs = FocusableInputs;
  public os$: Observable<string>;
  public menuSize = Config.defaultSecondaryMenuSize;
  public trackByUuid = trackByUuid;
  private destroy$ = new Subject<void>();

  constructor(
    private environmentsService: EnvironmentsService,
    private store: Store,
    private eventsService: EventsService,
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
    this.databucketsFilter = this.formBuilder.control('');

    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.activeDatabucket$ = this.store.selectActiveDatabucket();
    this.settings$ = this.store.select('settings');
    this.databucketsFilter$ = this.store.selectFilter('databuckets').pipe(
      tap((search) => {
        this.databucketsFilter.patchValue(search, { emitEvent: false });
      })
    );

    this.databucketList$ = this.store.selectActiveEnvironment().pipe(
      filter((activeEnvironment) => !!activeEnvironment),
      distinctUntilChanged(),
      map((activeEnvironment) => activeEnvironment.data)
    );

    this.databucketsFilter.valueChanges
      .pipe(
        debounceTime(10),
        tap((search) =>
          this.store.update(updateFilterAction('databuckets', search))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
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

  /**
   * Clear the databucket filter
   */
  public clearFilter() {
    this.store.update(updateFilterAction('databuckets', ''));
  }
}
