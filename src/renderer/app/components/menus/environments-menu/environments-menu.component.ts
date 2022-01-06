import { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Environment, Environments } from '@mockoon/commons';
import { merge, Observable, Subject } from 'rxjs';
import {
  distinctUntilKeyChanged,
  filter,
  map,
  takeUntil,
  tap
} from 'rxjs/operators';
import { EnvironmentsContextMenu } from 'src/renderer/app/components/context-menu/context-menus';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { ContextMenuEvent } from 'src/renderer/app/models/context-menu.model';
import { ScrollDirection } from 'src/renderer/app/models/ui.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { EnvironmentsStatuses, Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/shared/config';
import { Settings } from 'src/shared/models/settings.model';

@Component({
  selector: 'app-environments-menu',
  templateUrl: './environments-menu.component.html',
  styleUrls: ['./environments-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnvironmentsMenuComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('environmentsMenu')
  private environmentsMenu: ElementRef;
  public activeEnvironment$: Observable<Environment>;
  public environments$: Observable<Environments>;
  public environmentsStatus$: Observable<EnvironmentsStatuses>;
  public settings$: Observable<Settings>;
  public menuSize = Config.defaultEnvironmentMenuSize;
  public editingName = false;
  public activeEnvironmentForm: FormGroup;
  public dragDisabled = false;
  public focusableInputs = FocusableInputs;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private environmentsService: EnvironmentsService,
    private store: Store,
    private eventsService: EventsService,
    private uiService: UIService
  ) {}

  ngOnInit() {
    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.environments$ = this.store.select('environments');
    this.environmentsStatus$ = this.store.select('environmentsStatus');
    this.settings$ = this.store.select('settings');

    this.initForms();
    this.initFormValues();
  }

  ngAfterViewInit() {
    this.uiService.scrollEnvironmentsMenu.subscribe((scrollDirection) => {
      this.uiService.scroll(
        this.environmentsMenu.nativeElement,
        scrollDirection
      );
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  /**
   * Handle clicks on the env name
   * enable editing mode and automatically focus the input
   */
  public handleNameClick(event: MouseEvent) {
    event.stopPropagation();

    if (!this.editingName) {
      this.enableNameEdit();

      setTimeout(() => {
        this.uiService.focusInput(this.focusableInputs.ENVIRONMENT_NAME);
      }, 0);
    }
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
    this.environmentsService
      .addEnvironment()
      .pipe(
        tap(() => {
          this.uiService.scrollToBottom(this.environmentsMenu.nativeElement);
        })
      )
      .subscribe();
  }

  /**
   * Open an environment. Append at the end of the list.
   */
  public openEnvironment() {
    this.environmentsService
      .openEnvironment()
      .pipe(
        tap(() => {
          this.uiService.scrollToBottom(this.environmentsMenu.nativeElement);
        })
      )
      .subscribe();
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

  public disableNameEdit() {
    this.editingName = false;
    this.dragDisabled = false;
  }

  public submitEnvironmentName(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      (event.target as HTMLInputElement).blur();
    }
  }

  private enableNameEdit() {
    this.editingName = true;
    this.dragDisabled = true;
  }

  /**
   * Init active environment form and subscribe to changes
   */
  private initForms() {
    this.activeEnvironmentForm = this.formBuilder.group({
      name: new FormControl('', { updateOn: 'blur' })
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
          this.environmentsService.updateActiveEnvironment(newProperty);
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
