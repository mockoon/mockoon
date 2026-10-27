import { Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `<div
    class="spinner-border d-flex"
    style="width: {{ size() }}px; height: {{ size() }}px;"
    role="status"
  >
    <span class="visually-hidden">Loading...</span>
  </div>`
})
export class SpinnerComponent {
  public size = input('16');
}
