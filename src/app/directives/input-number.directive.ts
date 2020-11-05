import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

// TODO use control value accessor to avoid sending change event with non sanitized data and then with sanitized data
// https://blog.angularindepth.com/never-again-be-confused-when-implementing-controlvalueaccessor-in-angular-forms-93b9eee9ee83
// https://stackoverflow.com/questions/36770846/angular-2-prevent-input-and-model-changing-using-directive

@Directive({
  selector: '[InputNumber]'
})
export class InputNumberDirective {
  @Input()
  public InputNumber: { min: number; max: number; canBeEmpty: boolean };

  constructor(private elementRef: ElementRef, private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  public onInputChange(e) {
    const value = this.elementRef.nativeElement.value;

    // remove everything other than numbers
    let sanitizedValue = value.replace(/[^0-9]/g, '');
    // remove leading zero
    sanitizedValue = sanitizedValue.replace(/^0([1-9]+)/g, '$1');

    // if empty put Min
    if (sanitizedValue === '' && !this.InputNumber.canBeEmpty) {
      sanitizedValue = this.InputNumber.min;
    } else if (sanitizedValue === '' && this.InputNumber.canBeEmpty) {
      // write new value to the model
      this.ngControl.control.setValue(null);

      return;
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
