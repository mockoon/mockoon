import { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { DataBucket, Environment } from '@mockoon/commons';
import { combineLatest, from, Observable, Subscription } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  tap
} from 'rxjs/operators';
import { DatabucketsContextMenu } from 'src/renderer/app/components/context-menu/context-menus';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { ContextMenuEvent } from 'src/renderer/app/models/context-menu.model';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { updateEnvironmentDatabucketsFilterAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/shared/config';
import { Settings } from 'src/shared/models/settings.model';

@Component({
  selector: 'app-databuckets-menu',
  templateUrl: './databuckets-menu.component.html',
  styleUrls: ['./databuckets-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatabucketsMenuComponent implements OnInit, OnDestroy {
  @ViewChild('databucketsMenu') private databucketsMenu: ElementRef;
  public settings$: Observable<Settings>;
  public activeEnvironment$: Observable<Environment>;
  public databucketList$: Observable<DataBucket[]>;
  public activeDatabucket$: Observable<DataBucket>;
  public databucketsFilter$: Observable<string>;
  public databucketsFilter: FormControl;
  public dragIsDisabled = false;
  public focusableInputs = FocusableInputs;
  public os$: Observable<string>;
  public menuSize = Config.defaultRouteMenuSize;
  private databucketsFilterSubscription: Subscription;

  constructor(
    private environmentsService: EnvironmentsService,
    private store: Store,
    private eventsService: EventsService,
    private uiService: UIService,
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
    this.databucketsFilter = this.formBuilder.control('');

    this.activeEnvironment$ = this.store.selectActiveEnvironment();
    this.activeDatabucket$ = this.store.selectActiveDatabucket();
    this.settings$ = this.store.select('settings');
    this.databucketsFilter$ = this.store.select('databucketsFilter');

    this.databucketList$ = combineLatest([
      this.store.selectActiveEnvironment().pipe(
        filter((activeEnvironment) => !!activeEnvironment),
        distinctUntilChanged(),
        map((activeEnvironment) => activeEnvironment.data)
      ),
      this.databucketsFilter$.pipe(
        tap((search) => {
          this.databucketsFilter.patchValue(search, { emitEvent: false });
        })
      )
    ]).pipe(
      map(([databuckets, search]) => {
        this.dragIsDisabled = search.length > 0;

        return databuckets.filter((databucket) =>
          databucket.name.includes(search)
        );
      })
    );

    this.uiService.scrollDatabucketsMenu.subscribe((scrollDirection) => {
      this.uiService.scroll(
        this.databucketsMenu.nativeElement,
        scrollDirection
      );
    });

    this.databucketsFilterSubscription = this.databucketsFilter.valueChanges
      .pipe(
        debounceTime(10),
        tap((search) =>
          this.store.update(updateEnvironmentDatabucketsFilterAction(search))
        )
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.databucketsFilterSubscription.unsubscribe();
  }

  /**
   * Callback called when reordering databuckets
   *
   * @param event
   */
  public reorderDatabuckets(event: CdkDragDrop<string[]>) {
    this.environmentsService.moveMenuItem(
      'databuckets',
      event.previousIndex,
      event.currentIndex
    );
  }

  /**
   * Create a new databucket in the current environment. Append at the end of the list
   */
  public addDatabucket() {
    this.environmentsService.addDatabucket();
    console.log('add a dtbucket');
    if (this.databucketsMenu) {
      this.uiService.scrollToBottom(this.databucketsMenu.nativeElement);
    }
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
    this.store.update(updateEnvironmentDatabucketsFilterAction(''));
  }
}
