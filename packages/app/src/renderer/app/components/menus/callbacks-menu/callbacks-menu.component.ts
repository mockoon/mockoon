import { AsyncPipe, LowerCasePipe, UpperCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  inject,
  viewChildren
} from '@angular/core';
import {
  Callback,
  ReorderAction,
  ReorderableContainers
} from '@mockoon/commons';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  combineLatestWith,
  distinctUntilChanged,
  filter,
  map,
  tap
} from 'rxjs/operators';
import { ActionToolbarComponent } from 'src/renderer/app/components/action-toolbar/action-toolbar.component';
import {
  DropdownMenuComponent,
  DropdownMenuItem
} from 'src/renderer/app/components/dropdown-menu/dropdown-menu.component';
import { FilterComponent } from 'src/renderer/app/components/filter/filter.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { DraggableDirective } from 'src/renderer/app/directives/draggable.directive';
import { DropzoneDirective } from 'src/renderer/app/directives/dropzone.directive';
import { ResizeColumnDirective } from 'src/renderer/app/directives/resize-column.directive';
import { ScrollWhenActiveDirective } from 'src/renderer/app/directives/scroll-to-active.directive';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import {
  buildSelectionRange,
  getVisibleOrderedDatasetUuids,
  textFilter,
  toggleSelectionUuid
} from 'src/renderer/app/libs/utils.lib';
import { ToolbarButtonConfig } from 'src/renderer/app/models/ui.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { Settings } from 'src/shared/models/settings.model';

type dropdownMenuPayload = { callbackUuid: string };

@Component({
  selector: 'app-callbacks-menu',
  templateUrl: './callbacks-menu.component.html',
  styleUrls: ['./callbacks-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgbTooltip,
    SvgComponent,
    FilterComponent,
    DraggableDirective,
    DropzoneDirective,
    ScrollWhenActiveDirective,
    DropdownMenuComponent,
    ActionToolbarComponent,
    ResizeColumnDirective,
    AsyncPipe,
    UpperCasePipe,
    LowerCasePipe
  ]
})
export class CallbacksMenuComponent implements OnInit {
  private environmentsService = inject(EnvironmentsService);
  private store = inject(Store);
  private callbackRows =
    viewChildren<ElementRef<HTMLAnchorElement>>('callbackRow');

  public settings$: Observable<Settings>;
  public callbackList$: Observable<Callback[]>;
  public activeCallback$: Observable<Callback>;
  public callbacksFilter$: Observable<string>;
  public focusableInputs = FocusableInputs;
  public menuSize = Config.defaultSecondaryMenuSize;
  public isActiveEnvironmentEditable$ =
    this.store.selectIsActiveEnvironmentEditable();
  public selectedCallbacks$ = new BehaviorSubject<string[]>([]);
  private lastClickedCallbackUuid: string | null = null;

  public getToolbarButtons(): ToolbarButtonConfig[] {
    const disabled$ = this.isActiveEnvironmentEditable$.pipe(
      map((isEditable) => !isEditable)
    );

    return [
      {
        id: 'callbacks-batch-duplicate',
        action: 'duplicate',
        icon: 'content_copy',
        ariaLabel: 'Duplicate selected callbacks',
        tooltip: 'Duplicate selected callbacks',
        disabled$
      },
      {
        id: 'callbacks-batch-duplicate-to-env',
        action: 'duplicate-to-env',
        icon: 'input',
        ariaLabel: 'Duplicate selected callbacks to another environment',
        tooltip: 'Duplicate selected callbacks to another environment'
      },
      {
        id: 'callbacks-batch-delete',
        action: 'delete',
        icon: 'delete',
        ariaLabel: 'Delete selected callbacks',
        tooltip: 'Delete selected callbacks',
        twoSteps: true,
        confirmIcon: 'error',
        confirmAriaLabel: 'Confirm delete selected callbacks',
        confirmTooltip: 'Click again to confirm deletion',
        disabled$
      },
      {
        id: 'callbacks-batch-clear',
        action: 'clear',
        icon: 'close',
        ariaLabel: 'Clear selection',
        tooltip: 'Clear selection (Esc)'
      }
    ];
  }
  public dropdownMenuItems: DropdownMenuItem[] = [
    {
      label: 'Duplicate',
      icon: 'content_copy',
      twoSteps: false,
      disabled$: () =>
        this.isActiveEnvironmentEditable$.pipe(
          map((isEditable) => !isEditable)
        ),
      action: ({ callbackUuid }: dropdownMenuPayload) => {
        this.environmentsService.duplicateCallback(callbackUuid);
      }
    },
    {
      label: 'Duplicate to environment',
      icon: 'input',
      twoSteps: false,
      disabled$: () =>
        this.store
          .select('environments')
          .pipe(map((environments) => environments.length < 2)),
      action: ({ callbackUuid }: dropdownMenuPayload) => {
        this.environmentsService.startEntityDuplicationToAnotherEnvironment(
          'callback',
          [callbackUuid]
        );
      }
    },
    {
      label: 'Delete',
      icon: 'delete',
      twoSteps: true,
      confirmIcon: 'error',
      confirmLabel: 'Confirm deletion',
      disabled$: () =>
        this.isActiveEnvironmentEditable$.pipe(
          map((isEditable) => !isEditable)
        ),
      action: ({ callbackUuid }: dropdownMenuPayload) => {
        this.environmentsService.removeCallback(callbackUuid);
      }
    }
  ];

  ngOnInit() {
    this.activeCallback$ = this.store.selectActiveCallback();
    this.settings$ = this.store.select('settings');
    this.callbacksFilter$ = this.store.selectFilter('callbacks');

    this.callbackList$ = this.store.selectActiveEnvironment().pipe(
      filter((activeEnvironment) => !!activeEnvironment),
      distinctUntilChanged(),
      tap((activeEnvironment) => {
        const currentSelection = this.selectedCallbacks$.value;
        if (currentSelection.length === 0) {
          return;
        }

        const existing = new Set(
          activeEnvironment.callbacks.map((c) => c.uuid)
        );
        const nextSelection = currentSelection.filter((uuid) =>
          existing.has(uuid)
        );

        if (nextSelection.length !== currentSelection.length) {
          this.selectedCallbacks$.next(nextSelection);

          if (nextSelection.length === 0) {
            this.lastClickedCallbackUuid = null;
          }
        }
      }),
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
  public selectCallback(callbackUUID: string, event?: MouseEvent) {
    if (event && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.toggleCallbackSelection(callbackUUID);

      if (this.selectedCallbacks$.value.length > 0) {
        this.lastClickedCallbackUuid = callbackUUID;
      }

      return;
    }

    if (event?.shiftKey) {
      event.preventDefault();
      this.selectCallbackRange(callbackUUID);

      return;
    }

    if (this.selectedCallbacks$.value.length > 0) {
      this.selectedCallbacks$.next([]);
      this.lastClickedCallbackUuid = null;
    }

    this.lastClickedCallbackUuid = callbackUUID;
    this.environmentsService.setActiveCallback(callbackUUID);
  }

  public toggleCallbackSelection(callbackUUID: string) {
    const next = toggleSelectionUuid(
      this.selectedCallbacks$.value,
      callbackUUID
    );
    this.selectedCallbacks$.next(next);

    if (next.length === 0) {
      this.lastClickedCallbackUuid = null;
    }
  }

  private selectCallbackRange(callbackUUID: string) {
    const ordered = this.getVisibleOrderedCallbackUuids();
    const activeCallbackUUID = this.store.get('activeCallbackUUID');
    const anchorUuid =
      this.lastClickedCallbackUuid ?? activeCallbackUUID ?? callbackUUID;
    const range = buildSelectionRange(
      ordered,
      this.selectedCallbacks$.value,
      anchorUuid,
      callbackUUID
    );

    if (!range) {
      this.toggleCallbackSelection(callbackUUID);

      return;
    }

    this.selectedCallbacks$.next(range);

    if (range.length === 0) {
      this.lastClickedCallbackUuid = null;
    }
  }

  private getVisibleOrderedCallbackUuids(): string[] {
    return getVisibleOrderedDatasetUuids(this.callbackRows(), 'callbackUuid');
  }

  public clearSelection() {
    if (this.selectedCallbacks$.value.length === 0) {
      return;
    }

    this.selectedCallbacks$.next([]);
    this.lastClickedCallbackUuid = null;
  }

  public batchDuplicate() {
    for (const callbackUUID of this.selectedCallbacks$.value) {
      this.environmentsService.duplicateCallback(callbackUUID);
    }
  }

  public batchDuplicateToEnvironment() {
    const selection = this.selectedCallbacks$.value;
    if (selection.length === 0) {
      return;
    }

    this.environmentsService.startEntityDuplicationToAnotherEnvironment(
      'callback',
      [...selection]
    );
  }

  public batchDelete() {
    const selection = [...this.selectedCallbacks$.value];
    this.selectedCallbacks$.next([]);
    this.lastClickedCallbackUuid = null;

    for (const callbackUUID of selection) {
      this.environmentsService.removeCallback(callbackUUID);
    }
  }

  public onToolbarAction(action: string) {
    if (action === 'duplicate') {
      this.batchDuplicate();

      return;
    }

    if (action === 'duplicate-to-env') {
      this.batchDuplicateToEnvironment();

      return;
    }

    if (action === 'delete') {
      this.batchDelete();

      return;
    }

    if (action === 'clear') {
      this.clearSelection();
    }
  }

  @HostListener('document:keydown.escape')
  public onEscape() {
    this.clearSelection();
  }
}
