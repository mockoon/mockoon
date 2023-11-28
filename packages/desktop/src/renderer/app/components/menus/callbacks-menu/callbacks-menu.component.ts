import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import {
  Callback,
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
import { CallbacksContextMenu } from 'src/renderer/app/components/context-menu/context-menus';
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
  selector: 'app-callbacks-menu',
  templateUrl: './callbacks-menu.component.html',
  styleUrls: ['./callbacks-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CallbacksMenuComponent implements OnInit, OnDestroy {
  public settings$: Observable<Settings>;
  public activeEnvironment$: Observable<Environment>;
  public callbackList$: Observable<Callback[]>;
  public activeCallback$: Observable<Callback>;
  public callbacksFilter$: Observable<string>;
  public callbacksFilter: FormControl;
  public focusableInputs = FocusableInputs;
  public os$: Observable<string>;
  public menuSize = Config.defaultSecondaryMenuSize;
  public trackByUuid = trackByUuid;
  private destroy$ = new Subject<void>();

  constructor(
    private environmentsService: EnvironmentsService,
    private store: Store,
    private eventsService: EventsService,
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
    this.callbacksFilter = this.formBuilder.control('');

    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.activeCallback$ = this.store.selectActiveCallback();
    this.settings$ = this.store.select('settings');
    this.callbacksFilter$ = this.store.selectFilter('callbacks').pipe(
      tap((search) => {
        this.callbacksFilter.patchValue(search, { emitEvent: false });
      })
    );

    this.callbackList$ = this.store.selectActiveEnvironment().pipe(
      filter((activeEnvironment) => !!activeEnvironment),
      distinctUntilChanged(),
      map((activeEnvironment) => activeEnvironment.callbacks)
    );

    this.callbacksFilter.valueChanges
      .pipe(
        debounceTime(10),
        tap((search) =>
          this.store.update(updateFilterAction('callbacks', search))
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

  /**
   * Clear the callback filter
   */
  public clearFilter() {
    this.store.update(updateFilterAction('callbacks', ''));
  }
}
