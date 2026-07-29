import { Component, input, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { RadioItem, RadioItems } from 'src/renderer/app/models/common.model';

/**
 * Create a radio-like buttons group, possibly nullable
 */
@Component({
  selector: 'app-radio',
  templateUrl: 'radio.component.html',
  imports: [NgbTooltip, SvgComponent]
})
export class RadioComponent implements FormValueControl<string | number> {
  // form related inputs
  public value = model<string | number>(null);
  public touched = model<boolean>(false);
  public disabled = input<boolean>(false);
  public readonly = input<boolean>(false);

  // component related inputs

  // prefix is used to generate a unique id for the checkbox and its label
  public prefix = input.required<string>();
  public items = input.required<RadioItems>();
  public label = input<string>();
  public nullable = input<boolean>(true);

  /**
   * Uncheck a radio button when already active
   *
   * @param item
   */
  public onValueChange(item: RadioItem, event: Event): void {
    if (this.readonly() || this.disabled()) {
      return;
    }

    this.touched.set(true);

    if (this.nullable() && item.value === this.value()) {
      event?.preventDefault();
      this.value.set(null);
    } else {
      this.value.set(item.value);
    }
  }
}
