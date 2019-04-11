import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

// TODO use control value accessor to avoid sending change event with non sanitized data and then with sanitized data
// https://blog.angularindepth.com/never-again-be-confused-when-implementing-controlvalueaccessor-in-angular-forms-93b9eee9ee83
// https://stackoverflow.com/questions/36770846/angular-2-prevent-input-and-model-changing-using-directive


@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[InputNumber]'
})
export class InputNumberDirective {
  @Input() InputNumber: { min: number, max: number };

  constructor(private elementRef: ElementRef, private ngControl: NgControl) { }

  @HostListener('input', ['$event']) onInputChange(e) {
    const value = this.elementRef.nativeElement.value;

    // remove everything other than numbers
    let sanitizedValue = value.replace(/[^0-9]/g, '');
    // remove leading zero
    sanitizedValue = sanitizedValue.replace(/^0/g, '');

    // if empty put 0
    if (!sanitizedValue) {
      sanitizedValue = 0;
    }

    // handle min/max values
    if (sanitizedValue < this.InputNumber.min) {
      sanitizedValue = this.InputNumber.min;
    }
    if (sanitizedValue > this.InputNumber.max) {
      sanitizedValue = this.InputNumber.max;
    }

    sanitizedValue = parseInt(sanitizedValue, 10);

    // write new value to the model
    this.ngControl.control.setValue(sanitizedValue);
  }
}
