import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { TimedBoolean } from 'src/renderer/app/classes/timed-boolean';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';

/**
 * Add a dropdown menu, with a three dots vertical icon.
 * Provide a list of items, each with a label, an icon, a twoSteps boolean and an action function.
 *
 * To fade the icon when parent not active or not hovered, enable the iconFaded input and add a `hover-parent` class to the parent element.
 */
@Component({
  selector: 'app-dropdown-menu',
  templateUrl: './dropdown-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownMenuComponent {
  @Input({ required: true })
  public items: {
    label: string;
    icon: string;
    // If true, the item will require a confirmation click
    twoSteps: boolean;
    // must be provided if twoSteps is true
    confirmIcon?: string;
    // must be provided if twoSteps is true
    confirmLabel?: string;
    // If provided, the item will be disabled when the observable emits true
    disabled$?: (payload: any) => Observable<boolean>;
    // Can be provided to display a custom disabled label
    disabledLabel?: string;
    action: (payload: any) => void;
  }[];

  /**
   * Payload provided by the parent, to be sent to the action functions
   */
  @Input()
  public payload: any = null;

  @Input({ required: true })
  public idPrefix: string;

  // label to display as the dropdown button
  @Input()
  public label: string = null;

  // set to null to use default caret
  @Input()
  public icon: SvgComponent['icon'] = 'more_vert';

  @Input()
  public iconFaded = false;

  @Input()
  public noYPadding = false;

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
  public itemClicked(item: (typeof this.items)[number], dropdown: NgbDropdown) {
    if (
      !item.twoSteps ||
      (item.twoSteps && this.confirmRequested$.readValue().enabled)
    ) {
      item.action(this.payload);
      dropdown.close();
    }
  }
}
