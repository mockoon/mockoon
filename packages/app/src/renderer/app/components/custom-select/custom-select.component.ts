import { AsyncPipe, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  HostBinding,
  HostListener,
  Input,
  OnInit,
  viewChild,
  viewChildren
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  UntypedFormControl
} from '@angular/forms';
import {
  NgbDropdown,
  NgbDropdownButtonItem,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbTooltip
} from '@ng-bootstrap/ng-bootstrap';
import { NgxMaskDirective } from 'ngx-mask';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import {
  DropdownItem,
  DropdownItems,
  Validation
} from 'src/renderer/app/models/common.model';

/**
 * Custom select with categories and text input for
 * search and custom validated entries.
 * Currently designed to work best with a mask.
 * It would need some adaptation to offer some basic validation.
 */
@Component({
  selector: 'app-custom-select',
  templateUrl: './custom-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIf,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    FormsModule,
    NgxMaskDirective,
    ReactiveFormsModule,
    NgbDropdownButtonItem,
    NgbDropdownItem,
    NgbTooltip,
    SvgComponent,
    AsyncPipe
  ]
})
export class CustomSelectComponent implements OnInit, ControlValueAccessor {
  @HostBinding('class')
  public hostClasses = 'overflow-hidden';
  @Input()
  public isNumber: boolean;
  @Input()
  public enableCustomInput = true;
  @Input()
  public customInputPlaceholder = 'Custom value';
  @Input()
  public emptyListMessage = 'Nothing found';
  @Input()
  public validation: Validation = null;
  @Input()
  public dropdownId: string;
  @Input()
  public placeholder = '';
  @Input()
  public unknownValueMessage = '';
  @Input()
  public clearable = false;
  @Input()
  public hasCategory = false;
  // List of disabled entries values if any
  @Input()
  public disabledList: (number | string)[] = null;
  @Input()
  public defaultClearValue?: any;
  @Input()
  public placeholderClasses?: string;
  public dropdown = viewChild<NgbDropdown>('dropdown');
  public dropdownMenuItems =
    viewChildren<ElementRef<HTMLButtonElement>>('dropdownMenuItems');
  public customValueInput =
    viewChild<ElementRef<HTMLInputElement>>('customValueInput');

  public items$ = new BehaviorSubject<DropdownItems>(null);
  public selectedItem$: Observable<DropdownItem>;
  public filteredItems$: Observable<DropdownItems>;
  public customValue = new UntypedFormControl('');
  public focusedItemIndex$ = new BehaviorSubject<number>(-1);

  public onChange: (_: any) => void;
  public onTouched: (_: any) => void;

  public window = window;

  private value$ = new BehaviorSubject<number | string>(null);

  @Input()
  public set items(items: DropdownItems) {
    this.items$.next(items);
  }

  /**
   * Navigate through dropdown items with the keyboard
   *
   * @param event
   */
  @HostListener('keydown', ['$event'])
  public handleArrowSelection(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      // avoid scrolling with arrows (scroll will follow the focused element anyway)
      event.preventDefault();

      if (
        this.focusedItemIndex$.value ===
        this.dropdownMenuItems().length - 1
      ) {
        this.focusedItemIndex$.next(-1);
      }

      this.dropdownMenuItems()[
        this.focusedItemIndex$.value + 1
      ].nativeElement.focus();
      this.focusedItemIndex$.next(this.focusedItemIndex$.value + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.focusedItemIndex$.value <= 0) {
        this.focusedItemIndex$.next(this.dropdownMenuItems().length);
      }

      this.dropdownMenuItems()[
        this.focusedItemIndex$.value - 1
      ].nativeElement.focus();
      this.focusedItemIndex$.next(this.focusedItemIndex$.value - 1);
    }
  }

  ngOnInit() {
    /**
     * Filter the dropdown items list.
     * Return the original list if the custom input is empty.
     */
    this.filteredItems$ = combineLatest([
      this.items$,
      this.customValue.valueChanges.pipe<string>(startWith(''))
    ]).pipe(
      debounceTime(100),
      map(([items, inputValue]) => {
        if (!inputValue) {
          return items;
        }

        // reset the focused item when filtering
        this.focusedItemIndex$.next(-1);

        return items.filter((item) =>
          item.value?.toString().includes(inputValue)
        );
      })
    );

    /**
     * Set the selected item from the value.
     * Also react to items update which can happen after the value has been set.
     */
    this.selectedItem$ = combineLatest([this.value$, this.items$]).pipe(
      map(([value]) => {
        return this.findItem(value);
      })
    );
  }

  /**
   * Handle reactive form writing a value to the model
   *
   * @param value
   */
  public writeValue(value: number | string): void {
    this.value$.next(value);
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Automatically focus or reset the custom input when dropdown opens/closes
   */
  public onDropdownOpenChange(opened: boolean) {
    if (opened) {
      // if we have a custom input focus it, or focus the first item
      setTimeout(() => {
        if (this.enableCustomInput) {
          this.customValueInput().nativeElement.focus();
        } else {
          if (this.dropdownMenuItems().length > 0) {
            this.dropdownMenuItems()[0].nativeElement.focus();
            this.focusedItemIndex$.next(0);
          }
        }
      }, 0);
    } else {
      this.customValue.reset();

      this.focusedItemIndex$.next(-1);
    }
  }

  /**
   * Set value when clicking on an item.
   * No need to convert the value to a number as it directly comes from the value in the itemsList
   *
   * @param value
   */
  public setValue(item: DropdownItem) {
    this.value$.next(item.value);
    this.onChange(item.value);
    this.customValue.reset();
    this.focusedItemIndex$.next(-1);
    this.dropdown().close();
  }

  public clearValue() {
    this.value$.next(this.defaultClearValue);
    this.onChange(this.defaultClearValue);
    this.focusedItemIndex$.next(-1);
  }

  public itemKeydown(item: DropdownItem, event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.setValue(item);
    } else {
      this.handleArrowSelection(event);
    }
  }

  /**
   * Set a custom value from the input.
   * A conversion to type number may be needed as it's an input[type="text"]
   *
   * @param event
   */
  public enterCustomValue(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      const customValue: number | string = this.isNumber
        ? parseInt(this.customValue.value, 10)
        : this.customValue.value;

      if (
        !this.isNumber ||
        (this.isNumber &&
          (customValue as number) >= this.validation.min &&
          (customValue as number) <= this.validation.max)
      ) {
        this.setValue(this.findItem(customValue));
      }
    } else {
      this.handleArrowSelection(event);
    }
  }

  /**
   * Set the disabled state of the custom input
   *
   * @param isDisabled
   */
  public setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.customValue.disable();
    } else {
      this.customValue.enable();
    }
  }

  private findItem(value: number | string): DropdownItem {
    let searchedItem = this.items$.value.find((item) => item.value === value);

    if (searchedItem === undefined) {
      searchedItem = { value, label: `${value}${this.unknownValueMessage}` };
    }

    return searchedItem;
  }
}
