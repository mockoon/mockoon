import { Directive, HostListener } from '@angular/core';

/**
 * Prevent dragging for small mouse moves
 */
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[MousedragDeadzone]'
})
export class MousedragDeadzoneDirective {
  private dragDeadzone = 10;
  private lastMouseDownPosition: { x: number; y: number };

  constructor() { }

  @HostListener('mousedown', ['$event']) onMouseDown(event: MouseEvent) {
    this.lastMouseDownPosition = { x: event.clientX, y: event.clientY };
  }

  @HostListener('mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    // if left mouse button pressed
    if (this.lastMouseDownPosition && event.buttons === 1) {
      const delta = Math.sqrt(
        Math.pow(event.clientX - this.lastMouseDownPosition.x, 2) +
        Math.pow(event.clientY - this.lastMouseDownPosition.y, 2)
      );

      if (delta < this.dragDeadzone) {
        event.stopPropagation();
      }
    }
  }
}
