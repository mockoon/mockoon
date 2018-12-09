import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2 } from '@angular/core';
import { NgModel } from '@angular/forms';

const autocompleteElementMaxHeight = 135; // from styles.scss

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[autocomplete]'
})
export class AutocompleteDirective {
  // list of strings for autocomplete and container for positioning
  @Input() autocomplete: { list: string[], container: string };
  @Output() ngModelChange: EventEmitter<any> = new EventEmitter();

  constructor(private renderer: Renderer2, private element: ElementRef, private model: NgModel) { }

  /**
   * Hide autocomplete element on input focus out
   *
   * @param event
   */
  @HostListener('focusout', ['$event']) onFocusOut(event) {
    // delay a little bit to allow item click (input unfocus happens before autocomplete item click event listener)
    setTimeout(() => {
      const autocompleteElement = this.element.nativeElement.parentNode.querySelector('.autocomplete');

      // get existing autocomplete element
      if (autocompleteElement) {
        autocompleteElement.remove();
      }
    }, 100);
  }

  /**
   * Handle up and down keys
   *
   * @param event
   */
  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    const autocompleteElement = this.element.nativeElement.parentNode.querySelector('.autocomplete');

    // handle esc key
    if (autocompleteElement && event.which === 27) {
      autocompleteElement.remove();
    }

    // handle enter key, validate arrow selection
    if (autocompleteElement && event.which === 13) {
      const selectedItem = autocompleteElement.querySelector('.autocomplete-item.selected');
      if (selectedItem) {
        // write new value to the model
        this.model.valueAccessor.writeValue(selectedItem.textContent);
        autocompleteElement.remove();

        // emit a model change
        this.ngModelChange.emit(selectedItem.textContent);
      }
    }

    // avoid intercepting route/env navigation keys
    if (autocompleteElement && (event.which === 40 || event.which === 38) && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      const items = autocompleteElement.querySelectorAll('.autocomplete-item');
      const itemHeight = items[0].getBoundingClientRect().height;
      const numberItemDisplayed = Math.floor(autocompleteElementMaxHeight / itemHeight) / 2; // ~4.xx displayed -> 4/2 = 2

      // remove all selected
      let selectedItemIndex;
      items.forEach((item, index) => {
        if (item.className.includes('selected')) {
          selectedItemIndex = index;
        }

        this.renderer.removeClass(item, 'selected');
      });

      let indexToSelect;

      // go down
      if (event.which === 40) {
        if (selectedItemIndex !== undefined) {
          if ((selectedItemIndex + 1) < items.length) {
            indexToSelect = selectedItemIndex + 1;

            // scroll progressively from middle
            if (indexToSelect > numberItemDisplayed) {
              autocompleteElement.scrollTop += itemHeight;
            }
          } else {
            indexToSelect = 0;
            autocompleteElement.scrollTop = 0;
          }
        } else {
          // start from top and scroll to top
          indexToSelect = 0;
          autocompleteElement.scrollTop = 0;
        }
      }

      // go up
      if (event.which === 38) {
        if (selectedItemIndex !== undefined) {
          if ((selectedItemIndex - 1) >= 0) {
            indexToSelect = selectedItemIndex - 1;

            // scroll progressively from middle
            if (indexToSelect < (items.length - 1 - numberItemDisplayed)) {
              autocompleteElement.scrollTop -= itemHeight;
            }
          } else {
            indexToSelect = items.length - 1;
            autocompleteElement.scrollTop = 424242; // go to maximum height
          }
        } else {
          // start from bottom and scroll to bottom
          indexToSelect = items.length - 1;
          autocompleteElement.scrollTop = 424242; // go to maximum height
        }
      }

      this.renderer.addClass(items[indexToSelect], 'selected');

      return false;
    }
  }

  /**
   * Handle input and focus events
   *
   * @param event
   */
  @HostListener('input', ['$event'])
  @HostListener('focus', ['$event'])
  onThing(event: KeyboardEvent) {
    // delay opening after closing of previous autocomplete (when switching from one to the other)
    setTimeout(() => {
      this.buildAutocompleteElement(event.target);
    }, 110);
  }

  /**
   * Build the autocomplete menu
   */
  private buildAutocompleteElement(input: any) {
    // Get parent element (input-group)
    const parentContainer = this.element.nativeElement.parentNode;
    let autocompleteElement = this.element.nativeElement.parentNode.querySelector('.autocomplete');

    // get existing autocomplete element
    if (!autocompleteElement) {
      autocompleteElement = this.createAutocompleteElement(input, parentContainer);
    }

    const searchResult = this.autocomplete.list.filter((autocompleteString) => {
      // filter when string found but excludes self
      return autocompleteString.toLowerCase().includes(input.value.toLowerCase()) && autocompleteString.toLowerCase() !== input.value.toLowerCase();
    });

    // if search returned a result build autocomplete menu
    if (searchResult.length) {
      // reset element content
      this.renderer.setProperty(autocompleteElement, 'innerHTML', '');

      let oneItem;
      searchResult.forEach((autocompleteString, stringIndex) => {
        const itemElement = this.renderer.createElement('div');
        this.renderer.addClass(itemElement, 'autocomplete-item');

        // preselect first item
        if (stringIndex === 0) {
          this.renderer.addClass(itemElement, 'selected');
        }

        this.renderer.setProperty(itemElement, 'innerHTML', autocompleteString);

        // create click event
        this.renderer.listen(itemElement, 'click', ($event) => {
          // write new value to the model
          this.model.valueAccessor.writeValue(autocompleteString);
          this.element.nativeElement.parentNode.querySelector('.autocomplete').remove();

          // emit a model change
          this.ngModelChange.emit(autocompleteString);
        });

        // append item to autocomplete element
        this.renderer.appendChild(autocompleteElement, itemElement);
        oneItem = itemElement;
      });

      // adjust inverted position depending of number of items
      if (autocompleteElement.className.includes('inverted')) {
        const inputPosition = input.getBoundingClientRect();
        const elementsSize = (searchResult.length * oneItem.getBoundingClientRect().height);
        if (elementsSize < autocompleteElementMaxHeight) {
          this.renderer.setStyle(autocompleteElement, 'top', (inputPosition.top - elementsSize) + 'px');
        } else {
          // if bigger again (text erase for example) reenable normal size
          this.renderer.setStyle(autocompleteElement, 'top', (inputPosition.top - autocompleteElementMaxHeight) + 'px');
        }
      }
    } else {
      // if nothing found remove eventually shown element
      if (autocompleteElement) {
        autocompleteElement.remove();
      }
    }
  }

  /**
   * Create an autocomplete element
   *
   * @param input - input triggering the autocompletion
   * @param parentContainer - input's parent container
   */
  private createAutocompleteElement(input: any, parentContainer) {
    const inputPosition = input.getBoundingClientRect();
    const headersTabContentHeight = document.querySelector(this.autocomplete.container)['offsetHeight'];
    let positionTop = inputPosition.bottom + 'px';

    // create autocomplete element
    const autocompleteElement = this.renderer.createElement('div');
    this.renderer.setAttribute(autocompleteElement, 'class', 'autocomplete');

    // if bottom of menu is outside of viewport
    if (inputPosition.bottom + autocompleteElementMaxHeight > headersTabContentHeight) {
      positionTop = (inputPosition.top - autocompleteElementMaxHeight) + 'px';
      this.renderer.setAttribute(autocompleteElement, 'class', 'autocomplete autocomplete-inverted');
    }
    this.renderer.setStyle(autocompleteElement, 'top', positionTop);
    this.renderer.setStyle(autocompleteElement, 'left', inputPosition.left + 'px');
    this.renderer.setStyle(autocompleteElement, 'width', inputPosition.width + 'px');

    // create mousemove event
    this.renderer.listen(autocompleteElement, 'mousemove', ($event) => {
      // remove selected item
      const selectedItem = autocompleteElement.querySelector('.autocomplete-item.selected');
      if (selectedItem) {
        this.renderer.removeClass(selectedItem, 'selected');
      }
    });

    this.renderer.appendChild(parentContainer, autocompleteElement);

    return autocompleteElement;
  }
}
