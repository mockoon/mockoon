import {
  Component,
  computed,
  debounced,
  ElementRef,
  input,
  model,
  signal,
  viewChild,
  viewChildren
} from '@angular/core';
import { form, FormField, FormValueControl } from '@angular/forms/signals';
import {
  NgbDropdown,
  NgbDropdownButtonItem,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbTooltip
} from '@ng-bootstrap/ng-bootstrap';
import { NgxMaskDirective } from 'ngx-mask';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import {
  DropdownItem,
  DropdownItems,
  Validation
} from 'src/renderer/app/models/common.model';

/**
 * Create a select dropdown with optional custom input and filtering
 */
@Component({
  selector: 'app-select',
  templateUrl: 'select.component.html',
  imports: [
    NgbTooltip,
    SvgComponent,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgxMaskDirective,
    NgbDropdownButtonItem,
    NgbDropdownItem,
    FormField
  ],
  host: {
    class: 'overflow-hidden',
    '(keydown)': 'handleArrowSelection($event)'
  }
})
export class SelectComponent implements FormValueControl<string | number> {
  // form related inputs
  public value = model<string | number>(null);
  public touched = model<boolean>(false);
  public disabled = input<boolean>(false);
  public readonly = input<boolean>(false);

  // component related inputs
  public isNumber = input<boolean>(false);
  public enableCustomInput = input<boolean>(true);
  public customInputPlaceholder = input<string>('Custom value');
  public emptyListMessage = input<string>('Nothing found');
  public validation = input<Validation>(null);
  public dropdownId = input.required<string>();
  public placeholder = input<string>('');
  public unknownValueMessage = input<string>('');
  public clearable = input<boolean>(false);
  public hasCategory = input<boolean>(false);
  // List of disabled entries values if any
  public disabledList = input<(number | string)[]>(null);
  public defaultClearValue = input<string | number>(null);
  public placeholderClasses = input<string>(null);
  public items = input.required<DropdownItems>();

  public dropdown = viewChild<NgbDropdown>('dropdown');
  public dropdownMenuItems =
    viewChildren<ElementRef<HTMLButtonElement>>('dropdownMenuItems');
  public customValueInput =
    viewChild<ElementRef<HTMLInputElement>>('customValueInput');

  public focusedItemIndex = signal<number>(-1);
  public customValue = form(signal(''));

  public selectedItem = computed(() => {
    return this.findItem(this.value());
  });
  public customValueDebounced = debounced(this.customValue().value, 100);
  public filteredItems = computed(() => {
    if (!this.customValueDebounced.value()) {
      return this.items();
    }

    return this.items().filter((item) =>
      item.value?.toString().includes(this.customValueDebounced.value())
    );
  });

  public window = window;

  /**
   * Navigate through dropdown items with the keyboard
   *
   * @param event
   */
  public handleArrowSelection(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    let nextIndex: number;

    if (event.key === 'ArrowDown') {
      // avoid scrolling with arrows (scroll will follow the focused element anyway)
      event.preventDefault();
      if (this.focusedItemIndex() === this.dropdownMenuItems().length - 1) {
        this.focusedItemIndex.set(-1);
      }

      nextIndex = this.focusedItemIndex() + 1;
    } else if (event.key === 'ArrowUp') {
      // avoid scrolling with arrows (scroll will follow the focused element anyway)
      event.preventDefault();
      if (this.focusedItemIndex() <= 0) {
        this.focusedItemIndex.set(this.dropdownMenuItems().length);
      }

      nextIndex = this.focusedItemIndex() - 1;
    }

    this.dropdownMenuItems()[nextIndex]?.nativeElement.focus();
    this.focusedItemIndex.set(nextIndex);
  }

  /**
   * Automatically focus or reset the custom input when dropdown opens/closes
   */
  public onDropdownOpenChange(opened: boolean) {
    if (opened) {
      // if we have a custom input focus it
      setTimeout(() => {
        if (this.enableCustomInput()) {
          this.customValueInput().nativeElement.focus();
        }
      }, 0);
    } else {
      this.customValue().value.set('');

      // reset the focused item when closing the dropdown
      this.focusedItemIndex.set(-1);
    }
  }

  /**
   * Set value when clicking on an item.
   * No need to convert the value to a number as it directly comes from the value in the itemsList
   *
   * @param value
   */
  public setValue(item: DropdownItem) {
    this.value.set(item.value);
    this.customValue().value.set('');
    this.focusedItemIndex.set(-1);
    this.dropdown().close();
  }

  public clearValue() {
    this.value.set(this.defaultClearValue());
    this.focusedItemIndex.set(-1);
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
    // reset the focused item when filtering
    this.focusedItemIndex.set(-1);

    if (event.key === 'Enter') {
      const customValue: number | string = this.isNumber()
        ? parseInt(this.customValue().value(), 10)
        : this.customValue().value();

      if (
        !this.isNumber() ||
        (this.isNumber() &&
          (customValue as number) >= this.validation().min &&
          (customValue as number) <= this.validation().max)
      ) {
        this.setValue(this.findItem(customValue));
      }
    } else {
      this.handleArrowSelection(event);
    }
  }

  private findItem(value: number | string): DropdownItem {
    let searchedItem = this.items().find((item) => item.value === value);

    if (searchedItem === undefined) {
      searchedItem = { value, label: `${value}${this.unknownValueMessage()}` };
    }

    return searchedItem;
  }
}
