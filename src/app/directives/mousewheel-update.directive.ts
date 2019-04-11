import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[MousewheelUpdate]'
})
export class MousewheelUpdateDirective {
  constructor(private elementRef: ElementRef, private ngControl: NgControl) { }

  @HostListener('mousewheel', ['$event']) onInputChange(event) {
    event.preventDefault();

    let currentValue = parseInt(this.elementRef.nativeElement.value, 10);

    const modifier = 1 * (Math.sign(event.wheelDeltaY));
    if (modifier > 0 || (modifier < 0 && currentValue !== 0)) {
      currentValue += modifier;

      // write new value to the model
      this.ngControl.control.setValue(currentValue);
    }
  }
}
