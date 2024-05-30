import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  Callback,
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
import { DropdownMenuComponent } from 'src/renderer/app/components/dropdown-menu/dropdown-menu.component';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { textFilter, trackByUuid } from 'src/renderer/app/libs/utils.lib';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { Settings } from 'src/shared/models/settings.model';

type contextMenuPayload = { callbackUuid: string };

@Component({
  selector: 'app-callbacks-menu',
  templateUrl: './callbacks-menu.component.html',
  styleUrls: ['./callbacks-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CallbacksMenuComponent implements OnInit {
  public settings$: Observable<Settings>;
  public callbackList$: Observable<Callback[]>;
  public activeCallback$: Observable<Callback>;
  public callbacksFilter$: Observable<string>;
  public focusableInputs = FocusableInputs;
  public menuSize = Config.defaultSecondaryMenuSize;
  public trackByUuid = trackByUuid;
  public contextMenuItems: DropdownMenuComponent['items'] = [
    {
      label: 'Duplicate',
      icon: 'content_copy',
      twoSteps: false,
      action: ({ callbackUuid }: contextMenuPayload) => {
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
      action: ({ callbackUuid }: contextMenuPayload) => {
        this.environmentsService.startEntityDuplicationToAnotherEnvironment(
          callbackUuid,
          'callback'
        );
      }
    },
    {
      label: 'Delete',
      icon: 'delete',
      twoSteps: true,
      confirmIcon: 'error',
      confirmLabel: 'Confirm deletion',
      action: ({ callbackUuid }: contextMenuPayload) => {
        this.environmentsService.removeCallback(callbackUuid);
      }
    }
  ];

  constructor(
    private environmentsService: EnvironmentsService,
    private store: Store
  ) {}

  ngOnInit() {
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
}
