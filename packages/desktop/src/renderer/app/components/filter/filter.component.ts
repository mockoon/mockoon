import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import { Observable, Subject, debounceTime, from, takeUntil, tap } from 'rxjs';
import { MainAPI } from 'src/renderer/app/constants/common.constants';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { StoreType } from 'src/renderer/app/models/store.model';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { updateFilterAction } from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';

@Component({
  selector: 'app-filter',
  templateUrl: 'filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class FilterComponent implements OnInit, OnDestroy {
  @Input({ required: true }) public filterName: keyof StoreType['filters'];
  @Input({ required: true }) public focusableInput: FocusableInputs;
  @Input() public classes: string;

  public filter: UntypedFormControl;
  public os: string;
  public os$: Observable<string>;
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private formBuilder: UntypedFormBuilder,
    private eventsService: EventsService,
    private uiService: UIService
  ) {}

  @HostListener('keydown', ['$event'])
  public escapeFilterInput(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.clearFilter();
    }
  }

  @HostListener('document:keydown', ['$event'])
  public focusFilterInput(event: KeyboardEvent) {
    if (
      ((event.ctrlKey && this.os !== 'darwin') ||
        (event.metaKey && this.os === 'darwin')) &&
      event.shiftKey &&
      event.key.toLowerCase() === 'f'
    ) {
      if (this.uiService.getModalInstance('templates')) {
        this.eventsService.focusInput.next(FocusableInputs.TEMPLATES_FILTER);
      } else if (this.store.get('activeView') === 'ENV_ROUTES') {
        this.eventsService.focusInput.next(FocusableInputs.ROUTE_FILTER);
      } else if (this.store.get('activeView') === 'ENV_DATABUCKETS') {
        this.eventsService.focusInput.next(FocusableInputs.DATABUCKET_FILTER);
      } else if (this.store.get('activeView') === 'ENV_CALLBACKS') {
        this.eventsService.focusInput.next(FocusableInputs.CALLBACK_FILTER);
      } else if (this.store.get('activeView') === 'ENV_LOGS') {
        this.eventsService.focusInput.next(FocusableInputs.LOGS_FILTER);
      }
    }
  }

  ngOnInit() {
    this.os$ = from(MainAPI.invoke('APP_GET_OS')).pipe(
      tap((os) => {
        this.os = os;
      })
    );
    this.filter = this.formBuilder.control('');
    this.filter.valueChanges
      .pipe(
        debounceTime(10),
        tap((search) =>
          this.store.update(updateFilterAction(this.filterName, search))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.store
      .selectFilter(this.filterName)
      .pipe(
        tap((search) => {
          this.filter.patchValue(search, { emitEvent: false });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public clearFilter() {
    this.store.update(updateFilterAction(this.filterName, ''));
  }
}
