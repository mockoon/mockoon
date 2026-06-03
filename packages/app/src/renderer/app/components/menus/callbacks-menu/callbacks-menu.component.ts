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
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
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
import { textFilter } from 'src/renderer/app/libs/utils.lib';
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
  private batchDeleteConfirmRequested$ = new TimedBoolean();
  public batchDeleteConfirming$ = this.batchDeleteConfirmRequested$.pipe(
    map((state) => state.enabled)
  );
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

          this.resetBatchDeleteConfirm();
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
      this.resetBatchDeleteConfirm();
    }

    this.lastClickedCallbackUuid = callbackUUID;
    this.environmentsService.setActiveCallback(callbackUUID);
  }

  public toggleCallbackSelection(callbackUUID: string) {
    const current = this.selectedCallbacks$.value;
    const next = current.includes(callbackUUID)
      ? current.filter((uuid) => uuid !== callbackUUID)
      : [...current, callbackUUID];
    this.selectedCallbacks$.next(next);

    if (next.length === 0) {
      this.lastClickedCallbackUuid = null;
    }

    this.resetBatchDeleteConfirm();
  }

  private selectCallbackRange(callbackUUID: string) {
    const ordered = this.getVisibleOrderedCallbackUuids();
    const activeCallbackUUID = this.store.get('activeCallbackUUID');
    const anchorUuid =
      this.lastClickedCallbackUuid ?? activeCallbackUUID ?? callbackUUID;
    const startIdx = ordered.indexOf(anchorUuid);
    const endIdx = ordered.indexOf(callbackUUID);

    if (startIdx === -1 || endIdx === -1) {
      this.toggleCallbackSelection(callbackUUID);

      return;
    }

    const [from, to] =
      startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    const range = ordered.slice(from, to + 1);

    if (
      range.length === 1 &&
      this.selectedCallbacks$.value.length === 1 &&
      this.selectedCallbacks$.value[0] === range[0]
    ) {
      this.selectedCallbacks$.next([]);
      this.lastClickedCallbackUuid = null;
      this.resetBatchDeleteConfirm();

      return;
    }

    this.selectedCallbacks$.next(range);
    this.resetBatchDeleteConfirm();
  }

  private getVisibleOrderedCallbackUuids(): string[] {
    return [...this.callbackRows()]
      .sort((a, b) => {
        const relation = a.nativeElement.compareDocumentPosition(
          b.nativeElement
        );

        if (relation === Node.DOCUMENT_POSITION_FOLLOWING) {
          return -1;
        }

        if (relation === Node.DOCUMENT_POSITION_PRECEDING) {
          return 1;
        }

        return 0;
      })
      .map((rowRef) => rowRef.nativeElement.dataset['callbackUuid'])
      .filter((uuid): uuid is string => !!uuid);
  }

  public clearSelection() {
    if (this.selectedCallbacks$.value.length === 0) {
      return;
    }

    this.selectedCallbacks$.next([]);
    this.lastClickedCallbackUuid = null;
    this.resetBatchDeleteConfirm();
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
    if (!this.batchDeleteConfirmRequested$.readValue().enabled) {
      return;
    }

    this.resetBatchDeleteConfirm();
    const selection = [...this.selectedCallbacks$.value];
    this.selectedCallbacks$.next([]);
    this.lastClickedCallbackUuid = null;

    for (const callbackUUID of selection) {
      this.environmentsService.removeCallback(callbackUUID);
    }
  }

  private resetBatchDeleteConfirm() {
    if (this.batchDeleteConfirmRequested$.getValue().enabled) {
      this.batchDeleteConfirmRequested$.next({ enabled: false, payload: null });
    }
  }

  @HostListener('document:keydown.escape')
  public onEscape() {
    this.clearSelection();
  }
}
