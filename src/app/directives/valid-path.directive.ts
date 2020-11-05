import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output
} from '@angular/core';
import { NgModel } from '@angular/forms';

/**
 * Use "input" event for HostListener, to react to actual input element modification, so we can emit through ngModelChange manually.
 * Otherwise, if HostListener is set on ngModelChange, data get sanitized,
 * input gets updated but ngModelChange actually emit (and save as json) the previous version
 *
 */
@Directive({
  selector: '[ngModel][ValidPath]',
  providers: [NgModel]
})
export class ValidPathDirective {
  @Input()
  public ValidPath: any;
  @Output()
  public ngModelChange: EventEmitter<any> = new EventEmitter();

  constructor(private model: NgModel, private el: ElementRef) {}

  @HostListener('input', ['$event'])
  public onInputChange(event) {
    const pos = this.el.nativeElement.selectionStart;
    const value = event.target.value;

    // remove double slashes
    let sanitizedValue = value.replace(/[\/\/]{2,}/gi, '/');

    // Remove leading slash
    sanitizedValue = sanitizedValue.replace(/^\//gi, '');

    // write new value to the model
    this.model.valueAccessor.writeValue(sanitizedValue);

    // emit a model change
    this.ngModelChange.emit(sanitizedValue);

    // set selection at initial position
    setTimeout(() => {
      this.el.nativeElement.selectionStart = pos;
      this.el.nativeElement.selectionEnd = pos;
    });
  }
}
