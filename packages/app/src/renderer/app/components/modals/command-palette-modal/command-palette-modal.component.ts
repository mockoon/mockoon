import { AsyncPipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  inject
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormControl
} from '@angular/forms';
import {
  BehaviorSubject,
  Observable,
  Subject,
  concat,
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  startWith,
  take,
  takeUntil,
  tap
} from 'rxjs';
import { SpinnerComponent } from 'src/renderer/app/components/spinner.component';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { FocusOnEventDirective } from 'src/renderer/app/directives/focus-event.directive';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import {
  Command,
  Commands
} from 'src/renderer/app/models/command-palette.model';
import { CommandPaletteService } from 'src/renderer/app/services/command-palette.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UIService } from 'src/renderer/app/services/ui.service';
import { Config } from 'src/renderer/config';

@Component({
  selector: 'app-command-palette-modal',
  templateUrl: './command-palette-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SvgComponent,
    FormsModule,
    FocusOnEventDirective,
    ReactiveFormsModule,
    NgClass,
    AsyncPipe,
    SpinnerComponent
  ]
})
export class CommandPaletteModalComponent implements OnInit, OnDestroy {
  private eventsService = inject(EventsService);
  private commandPaletteService = inject(CommandPaletteService);
  private uiService = inject(UIService);

  @HostBinding('class')
  public hostClasses = 'command-palette-modal d-flex flex-column flex-fill mh0';
  @ViewChildren('commandElement')
  public commandElements: QueryList<ElementRef<HTMLButtonElement>>;
  public focusableInputs = FocusableInputs;
  public commands$: Observable<Commands>;
  public searchControl = new UntypedFormControl('');
  public focusedItemIndex$ = new BehaviorSubject<number>(0);
  public isWeb = Config.isWeb;
  private destroy$ = new Subject<void>();
  private commands: Commands = [];

  /**
   * Navigate through dropdown items with the keyboard
   *
   * @param event
   */
  @HostListener('keydown', ['$event'])
  public handleArrowSelection(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.focusedItemIndex$.value === this.commands.length - 1) {
        this.focusedItemIndex$.next(-1);
      }

      this.focusedItemIndex$.next(this.focusedItemIndex$.value + 1);
      this.commandElements
        .get(this.focusedItemIndex$.value)
        .nativeElement.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.focusedItemIndex$.value <= 0) {
        this.focusedItemIndex$.next(this.commands.length);
      }

      this.focusedItemIndex$.next(this.focusedItemIndex$.value - 1);
      this.commandElements
        .get(this.focusedItemIndex$.value)
        .nativeElement.scrollIntoView({ block: 'nearest' });
    }
  }

  ngOnInit() {
    const modal = this.uiService.getModalInstance('commandPalette');

    merge(
      modal.shown.pipe(
        tap(() => {
          this.eventsService.focusInput.next(
            FocusableInputs.COMMAND_PALETTE_SEARCH
          );
        })
      ),
      modal.hidden.pipe(
        tap(() => {
          this.focusedItemIndex$.next(0);
          this.searchControl.setValue('');
        })
      )
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    const searchControl$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      map((search) => search.trim())
    );

    this.commands$ = this.commandPaletteService
      .filterEntries(
        concat(
          searchControl$.pipe(take(1)),
          searchControl$.pipe(debounceTime(50))
        ).pipe(
          distinctUntilChanged(),
          tap(() => {
            this.focusedItemIndex$.next(0);
          })
        )
      )
      .pipe(
        tap((commands) => {
          this.commands = commands;
        })
      );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public onCommandActivate(event: Event, command?: Command) {
    // ensure that the enter key does not select entries in other modals (e.g. duplicate to env)
    event.preventDefault();

    if (!command) {
      command = this.commands[this.focusedItemIndex$.getValue()];
    }

    command.action();
    this.uiService.closeModal('commandPalette');
  }
}
