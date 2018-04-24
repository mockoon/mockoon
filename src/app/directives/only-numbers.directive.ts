import { Directive, Input, HostListener, EventEmitter, Output } from '@angular/core';
import { NgModel } from '@angular/forms';

/**
 * Use "input" event for HostListener, to react to actual input element modification, so we can emit through ngModelChange manually.
 * Otherwise, if HostListener is set on ngModelChange, data get sanitized,
 * input gets updated but ngModelChange actually emit (and save as json) the previous version
 *
 */
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[ngModel][OnlyNumber]'
})
export class OnlyNumberDirective {
  @Input() OnlyNumber: { min: number, max: number };
  @Output() ngModelChange: EventEmitter<any> = new EventEmitter();

  constructor(private model: NgModel) { }

  @HostListener('input', ['$event']) onInputChange(event) {
    const value = event.target.value;

    // remove everything other than numbers
    let sanitizedValue = value.replace(/[^0-9]/g, '');
    // remove leading zero
    sanitizedValue = sanitizedValue.replace(/^0/g, '');

    // if empty put 0
    if (!sanitizedValue) {
      sanitizedValue = 0;
    }

    // handle min/max values
    if (sanitizedValue < this.OnlyNumber.min) {
      sanitizedValue = this.OnlyNumber.min;
    }
    if (sanitizedValue > this.OnlyNumber.max) {
      sanitizedValue = this.OnlyNumber.max;
    }

    sanitizedValue = parseInt(sanitizedValue, 10);

    // write new value to the model
    this.model.valueAccessor.writeValue(sanitizedValue);

    // emit a model change
    this.ngModelChange.emit(sanitizedValue);
  }
}
