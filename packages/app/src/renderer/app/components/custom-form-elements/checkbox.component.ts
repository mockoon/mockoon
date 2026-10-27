import { UpperCasePipe } from '@angular/common';
import { Component, input, model } from '@angular/core';
import { FormCheckboxControl } from '@angular/forms/signals';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SvgComponent } from 'src/renderer/app/components/svg/svg.component';
import { CheckboxItem } from 'src/renderer/app/models/common.model';

/**
 * Create a checkbox button -> true/false value
 */
@Component({
  selector: 'app-checkbox',
  templateUrl: 'checkbox.component.html',
  imports: [NgbTooltip, SvgComponent, UpperCasePipe]
})
export class CheckboxComponent implements FormCheckboxControl {
  // form related inputs
  public checked = model<boolean>(false);
  public touched = model<boolean>(false);
  public disabled = input<boolean>(false);
  public readonly = input<boolean>(false);

  // component related inputs

  // prefix is used to generate a unique id for the checkbox and its label
  public prefix = input.required<string>();

  // item is used to generate the checkbox content and tooltip
  public item = input.required<CheckboxItem>();

  public onCheckedChange(): void {
    if (this.readonly() || this.disabled()) {
      return;
    }

    this.touched.set(true);
    this.checked.set(!this.checked());
  }
}
