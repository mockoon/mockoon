import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup
} from '@angular/forms';
import { Environment, Environments } from '@mockoon/commons';
import { Observable, Subject, merge } from 'rxjs';
import {
  distinctUntilKeyChanged,
  filter,
  map,
  takeUntil,
  tap
} from 'rxjs/operators';
import { EnvironmentsContextMenu } from 'src/renderer/app/components/context-menu/context-menus';
import { trackByUuid } from 'src/renderer/app/libs/utils.lib';
import { ContextMenuEvent } from 'src/renderer/app/models/context-menu.model';
import { EnvironmentsStatuses } from 'src/renderer/app/models/store.model';
import {
  DraggableContainers,
  DropAction
} from 'src/renderer/app/models/ui.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';
import { Settings } from 'src/shared/models/settings.model';

@Component({
  selector: 'app-environments-menu',
  templateUrl: './environments-menu.component.html',
  styleUrls: ['./environments-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnvironmentsMenuComponent implements OnInit, OnDestroy {
  public activeEnvironment$: Observable<Environment>;
  public environments$: Observable<Environments>;
  public environmentsStatus$: Observable<EnvironmentsStatuses>;
  public settings$: Observable<Settings>;
  public menuSize = Config.defaultMainMenuSize;
  public editingName = false;
  public activeEnvironmentForm: UntypedFormGroup;
  public dragEnabled = true;
  public logsRecording$ = this.eventsService.logsRecording$;
  public trackByUuid = trackByUuid;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private environmentsService: EnvironmentsService,
    private store: Store,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.environments$ = this.store.select('environments');
    this.environmentsStatus$ = this.store.select('environmentsStatus');
    this.settings$ = this.store.select('settings');

    this.initForms();
    this.initFormValues();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public enableDrag(enable: boolean) {
    this.dragEnabled = enable;
  }

  /**
   * Callback called when reordering environments
   *
   * @param dropAction
   */
  public reorganizeEnvironments(dropAction: DropAction) {
    this.environmentsService.reorganizeItems(
      dropAction,
      DraggableContainers.ENVIRONMENTS
    );
  }

  /**
   * Create a new environment. Append at the end of the list.
   */
  public addEnvironment() {
    this.environmentsService.addEnvironment().subscribe();
  }

  /**
   * Open an environment. Append at the end of the list.
   */
  public openEnvironment() {
    this.environmentsService.openEnvironment().subscribe();
  }

  /**
   * Select the active environment
   */
  public selectEnvironment(environmentUUID: string) {
    this.environmentsService.setActiveEnvironment(environmentUUID);
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

  /**
   * Init active environment form and subscribe to changes
   */
  private initForms() {
    this.activeEnvironmentForm = this.formBuilder.group({
      name: new UntypedFormControl('')
    });

    // send new activeEnvironmentForm values to the store, one by one
    merge(
      ...Object.keys(this.activeEnvironmentForm.controls).map((controlName) =>
        this.activeEnvironmentForm.get(controlName).valueChanges.pipe(
          map((newValue) => ({
            [controlName]: newValue
          }))
        )
      )
    )
      .pipe(
        tap((newProperty) => {
          this.environmentsService.updateActiveEnvironment(newProperty, true);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Listen to stores to init form values
   */
  private initFormValues() {
    // subscribe to active environment changes to reset the form
    this.activeEnvironment$
      .pipe(
        filter((environment) => !!environment),
        distinctUntilKeyChanged('uuid'),
        tap((activeEnvironment) => {
          this.activeEnvironmentForm.setValue(
            {
              name: activeEnvironment.name
            },
            { emitEvent: false }
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }
}
