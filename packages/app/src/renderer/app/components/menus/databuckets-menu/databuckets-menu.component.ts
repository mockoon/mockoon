import { AsyncPipe } from '@angular/common';
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
  DataBucket,
  Environment,
  ProcessedDatabucketWithoutValue,
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
import { textFilter } from 'src/renderer/app/libs/utils.lib';
import { ToolbarButtonConfig } from 'src/renderer/app/models/ui.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { Settings } from 'src/shared/models/settings.model';

type dropdownMenuPayload = { databucketUuid: string };

@Component({
  selector: 'app-databuckets-menu',
  templateUrl: './databuckets-menu.component.html',
  styleUrls: ['./databuckets-menu.component.scss'],
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
    AsyncPipe
  ]
})
export class DatabucketsMenuComponent implements OnInit {
  private environmentsService = inject(EnvironmentsService);
  private store = inject(Store);
  private mainApiService = inject(MainApiService);
  private databucketRows =
    viewChildren<ElementRef<HTMLAnchorElement>>('databucketRow');

  public settings$: Observable<Settings>;
  public activeEnvironment$: Observable<Environment>;
  public databucketList$: Observable<DataBucket[]>;
  public activeDatabucket$: Observable<DataBucket>;
  public processedDatabuckets$: Observable<
    Record<string, ProcessedDatabucketWithoutValue>
  >;
  public databucketsFilter$: Observable<string>;
  public focusableInputs = FocusableInputs;
  public menuSize = Config.defaultSecondaryMenuSize;
  public isActiveEnvironmentEditable$ =
    this.store.selectIsActiveEnvironmentEditable();
  public selectedDatabuckets$ = new BehaviorSubject<string[]>([]);
  private lastClickedDatabucketUuid: string | null = null;

  public getToolbarButtons(): ToolbarButtonConfig[] {
    const disabled$ = this.isActiveEnvironmentEditable$.pipe(
      map((isEditable) => !isEditable)
    );

    return [
      {
        id: 'databuckets-batch-duplicate',
        action: 'duplicate',
        icon: 'content_copy',
        ariaLabel: 'Duplicate selected data buckets',
        tooltip: 'Duplicate selected data buckets',
        disabled$
      },
      {
        id: 'databuckets-batch-duplicate-to-env',
        action: 'duplicate-to-env',
        icon: 'input',
        ariaLabel: 'Duplicate selected data buckets to another environment',
        tooltip: 'Duplicate selected data buckets to another environment'
      },
      {
        id: 'databuckets-batch-delete',
        action: 'delete',
        icon: 'delete',
        ariaLabel: 'Delete selected data buckets',
        tooltip: 'Delete selected data buckets',
        twoSteps: true,
        confirmIcon: 'error',
        confirmAriaLabel: 'Confirm delete selected data buckets',
        confirmTooltip: 'Click again to confirm deletion',
        disabled$
      },
      {
        id: 'databuckets-batch-clear',
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
      action: ({ databucketUuid }: dropdownMenuPayload) => {
        this.environmentsService.duplicateDatabucket(databucketUuid);
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
      action: ({ databucketUuid }: dropdownMenuPayload) => {
        this.environmentsService.startEntityDuplicationToAnotherEnvironment(
          'databucket',
          [databucketUuid]
        );
      }
    },
    {
      label: 'Copy ID to clipboard',
      icon: 'assignment',
      twoSteps: false,
      action: ({ databucketUuid }: dropdownMenuPayload) => {
        const databucket = this.store.getDatabucketByUUID(databucketUuid);

        this.mainApiService.send('APP_WRITE_CLIPBOARD', databucket.id);
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
      action: ({ databucketUuid }: dropdownMenuPayload) => {
        this.environmentsService.removeDatabucket(databucketUuid);
      }
    }
  ];

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.activeDatabucket$ = this.store.selectActiveDatabucket();
    this.processedDatabuckets$ =
      this.store.selectActiveEnvironmentProcessedDatabuckets();
    this.settings$ = this.store.select('settings');
    this.databucketsFilter$ = this.store.selectFilter('databuckets');

    this.databucketList$ = this.store.selectActiveEnvironment().pipe(
      filter((activeEnvironment) => !!activeEnvironment),
      distinctUntilChanged(),
      tap((activeEnvironment) => {
        const currentSelection = this.selectedDatabuckets$.value;
        if (currentSelection.length === 0) {
          return;
        }

        const existing = new Set(activeEnvironment.data.map((d) => d.uuid));
        const nextSelection = currentSelection.filter((uuid) =>
          existing.has(uuid)
        );

        if (nextSelection.length !== currentSelection.length) {
          this.selectedDatabuckets$.next(nextSelection);

          if (nextSelection.length === 0) {
            this.lastClickedDatabucketUuid = null;
          }
        }
      }),
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
  public selectDatabucket(databucketUUID: string, event?: MouseEvent) {
    if (event && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.toggleDatabucketSelection(databucketUUID);

      if (this.selectedDatabuckets$.value.length > 0) {
        this.lastClickedDatabucketUuid = databucketUUID;
      }

      return;
    }

    if (event?.shiftKey) {
      event.preventDefault();
      this.selectDatabucketRange(databucketUUID);

      return;
    }

    if (this.selectedDatabuckets$.value.length > 0) {
      this.selectedDatabuckets$.next([]);
      this.lastClickedDatabucketUuid = null;
    }

    this.lastClickedDatabucketUuid = databucketUUID;
    this.environmentsService.setActiveDatabucket(databucketUUID);
  }

  public toggleDatabucketSelection(databucketUUID: string) {
    const current = this.selectedDatabuckets$.value;
    const next = current.includes(databucketUUID)
      ? current.filter((uuid) => uuid !== databucketUUID)
      : [...current, databucketUUID];
    this.selectedDatabuckets$.next(next);

    if (next.length === 0) {
      this.lastClickedDatabucketUuid = null;
    }
  }

  private selectDatabucketRange(databucketUUID: string) {
    const ordered = this.getVisibleOrderedDatabucketUuids();
    const activeDatabucketUUID = this.store.get('activeDatabucketUUID');
    const anchorUuid =
      this.lastClickedDatabucketUuid ?? activeDatabucketUUID ?? databucketUUID;
    const startIdx = ordered.indexOf(anchorUuid);
    const endIdx = ordered.indexOf(databucketUUID);

    if (startIdx === -1 || endIdx === -1) {
      this.toggleDatabucketSelection(databucketUUID);

      return;
    }

    const [from, to] =
      startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    const range = ordered.slice(from, to + 1);

    if (
      range.length === 1 &&
      this.selectedDatabuckets$.value.length === 1 &&
      this.selectedDatabuckets$.value[0] === range[0]
    ) {
      this.selectedDatabuckets$.next([]);
      this.lastClickedDatabucketUuid = null;

      return;
    }

    this.selectedDatabuckets$.next(range);
  }

  private getVisibleOrderedDatabucketUuids(): string[] {
    return [...this.databucketRows()]
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
      .map((rowRef) => rowRef.nativeElement.dataset['databucketUuid'])
      .filter((uuid): uuid is string => !!uuid);
  }

  public clearSelection() {
    if (this.selectedDatabuckets$.value.length === 0) {
      return;
    }

    this.selectedDatabuckets$.next([]);
    this.lastClickedDatabucketUuid = null;
  }

  public batchDuplicate() {
    for (const databucketUUID of this.selectedDatabuckets$.value) {
      this.environmentsService.duplicateDatabucket(databucketUUID);
    }
  }

  public batchDuplicateToEnvironment() {
    const selection = this.selectedDatabuckets$.value;
    if (selection.length === 0) {
      return;
    }

    this.environmentsService.startEntityDuplicationToAnotherEnvironment(
      'databucket',
      [...selection]
    );
  }

  public batchDelete() {
    const selection = [...this.selectedDatabuckets$.value];
    this.selectedDatabuckets$.next([]);
    this.lastClickedDatabucketUuid = null;

    for (const databucketUUID of selection) {
      this.environmentsService.removeDatabucket(databucketUUID);
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

  public copyToClipboard(databucketId: string, event: MouseEvent) {
    event.stopPropagation();

    this.mainApiService.send('APP_WRITE_CLIPBOARD', databucketId);
  }
}
