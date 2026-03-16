import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle
} from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';

export type DropdownMenuItem = {
  label: string | (() => Observable<string>);
  // less visible label (for additional information, ⚠️ not really compatible with twoSteps)
  subLabel?: string;
  icon: string;
  // If true, the item will require a confirmation click
  twoSteps: boolean;
  // must be provided if twoSteps is true
  confirmIcon?: string;
  // must be provided if twoSteps is true
  confirmLabel?: string;
  // If provided, the item will be disabled when the observable emits true
  disabled$?: (payload: any) => Observable<boolean>;
  // If provided, the item will be hidden when the observable emits true
  hidden$?: (payload: any) => Observable<boolean>;
  // Can be provided to display a custom disabled label
  disabledLabel$?: (payload: any) => Observable<string>;
  action?: (payload: any) => void;
};

export type DropdownMenuSeparator = {
  separator: boolean;
};

export type DropdownMenuElement = DropdownMenuItem | DropdownMenuSeparator;

/**
 * Add a dropdown menu, with a three dots vertical icon.
 * Provide a list of items, each with a label, an icon, a twoSteps boolean and an action function.
 *
 * To fade the icon when parent not active or not hovered, enable the iconFaded input and add a `hover-parent` class to the parent element.
 */
@Component({
  selector: 'app-dropdown-menu',
  templateUrl: './dropdown-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgbDropdown,
    NgbDropdownToggle,
    SvgComponent,
    NgbDropdownMenu,
    AsyncPipe
  ]
})
export class DropdownMenuComponent {
  public readonly items = input.required<DropdownMenuElement[]>();
  public readonly idPrefix = input.required<string>();
  // Payload provided by the parent, to be sent to the action functions
  public readonly payload = input<any>(null);
  // label to display as the dropdown button
  public readonly label = input<string>(null);
  // set to null to use default caret
  public readonly icon = input<SvgComponent['icon']>('more_vert');
  public readonly iconFaded = input(false);
  public readonly noYPadding = input(false);
  public readonly menuHeightFitContent = input(false);
  public confirmRequested$ = new TimedBoolean();
  public window = window;

  /**
   * Reset the confirm step on close
   *
   * @param change
   */
  public onChange(change: boolean) {
    if (change === false) {
      this.confirmRequested$.next({ enabled: false });
    }
  }

  /**
   * Handle the item click, close the dropdown and execute the action function
   *
   * @param item
   * @param dropdown
   */
  public itemClicked(item: DropdownMenuItem, dropdown: NgbDropdown) {
    if (
      !item.twoSteps ||
      (item.twoSteps && this.confirmRequested$.readValue().enabled)
    ) {
      if (item.action) {
        item.action(this.payload());
      }
      dropdown.close();
    }
  }

  /**
   * Used for type checking in the template
   *
   * @param element
   * @returns
   */
  public isItem(element: DropdownMenuElement): element is DropdownMenuItem {
    return 'label' in element;
  }

  /**
   * Used for type checking in the template
   *
   * @param element
   * @returns
   */
  public isSeparator(
    element: DropdownMenuElement
  ): element is DropdownMenuSeparator {
    return 'separator' in element;
  }
}
