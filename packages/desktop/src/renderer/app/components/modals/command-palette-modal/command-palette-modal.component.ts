import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
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
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { Commands } from 'src/renderer/app/models/command-palette.model';
import { CommandPaletteService } from 'src/renderer/app/services/command-palette.service';
import { EventsService } from 'src/renderer/app/services/events.service';
import { UIService } from 'src/renderer/app/services/ui.service';

@Component({
  selector: 'app-command-palette-modal',
  templateUrl: './command-palette-modal.component.html',
  styleUrls: ['command-palette-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommandPaletteModalComponent implements OnInit, OnDestroy {
  @ViewChildren('commandElement')
  public commandElements: QueryList<ElementRef<HTMLButtonElement>>;
  public focusableInputs = FocusableInputs;
  public commands$: Observable<Commands>;
  public searchControl = new UntypedFormControl('');
  public focusedItemIndex$ = new BehaviorSubject<number>(0);
  private destroy$ = new Subject<void>();
  private commands: Commands = [];

  constructor(
    private eventsService: EventsService,
    private commandPaletteService: CommandPaletteService,
    private uiService: UIService
  ) {}

  @HostBinding('class')
  public get hostClasses() {
    return 'command-palette-modal d-flex flex-column flex-fill mh0';
  }

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

  public onCommandActivate(event: Event, commandId?: string) {
    // ensure that the enter key does not select entries in other modals (e.g. duplicate to env)
    event.preventDefault();

    if (!commandId) {
      commandId = this.commands[this.focusedItemIndex$.getValue()].id;
    }

    this.commandPaletteService.executeCommand(commandId);
  }
}
