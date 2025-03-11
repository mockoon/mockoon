import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `<div
    class="spinner-border"
    style="width: {{ size() }}px; height: {{ size() }}px;"
    role="status"
  >
    <span class="visually-hidden">Loading...</span>
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerComponent {
  public size = input('16');
}
