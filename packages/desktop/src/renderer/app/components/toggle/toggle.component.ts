import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ToggleItem, ToggleItems } from 'src/renderer/app/models/common.model';

@Component({
  selector: 'app-toggle',
  templateUrl: 'toggle.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleComponent {
  @Input()
  public form: FormGroup;
  @Input()
  public controlName: string;
  @Input()
  public items: ToggleItems;
  @Input()
  public prefix: string;
  @Input()
  public uncheckable = true;

  constructor() {}

  /**
   * Uncheck a radio button when already active
   *
   * @param item
   * @param event
   */
  public itemClick(item: ToggleItem, event: MouseEvent) {
    if (
      this.uncheckable &&
      item.value === this.form.get(this.controlName).value
    ) {
      event.preventDefault();
      this.form.get(this.controlName).setValue(null);
    }
  }
}
