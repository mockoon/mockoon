import {
  Directive,
  ElementRef,
  forwardRef,
  HostListener,
  Renderer2
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * This directive is used to sanitize paths slashes.
 */
@Directive({
  selector: '[appValidPath]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ValidPathDirective),
      multi: true
    }
  ]
})
export class ValidPathDirective {
  public onChange: (_: any) => void;
  public onTouched: (_: any) => void;

  constructor(private renderer: Renderer2, private elementRef: ElementRef) {}

  /**
   * Handle values entered in the input field
   */
  @HostListener('input', ['$event.target.value'])
  @HostListener('change', ['$event.target.value'])
  public handleInput(inputValue: string) {
    const cursorPosition = this.elementRef.nativeElement.selectionStart;
    const sanitizedValue = this.sanitize(inputValue);

    this.onChange(sanitizedValue);

    this.renderer.setProperty(
      this.elementRef.nativeElement,
      'value',
      sanitizedValue
    );

    this.elementRef.nativeElement.selectionStart = cursorPosition;
    this.elementRef.nativeElement.selectionEnd = cursorPosition;
  }

  /**
   * Handle writing an initial value to the input.
   */
  public writeValue(value: string) {
    const sanitizedValue = this.sanitize(value);

    this.renderer.setProperty(
      this.elementRef.nativeElement,
      'value',
      sanitizedValue
    );
  }

  public registerOnChange(fn: any) {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  /**
   * Sanitize the entry:
   * - remove leading slash
   * - deduplicate slashes
   */
  private sanitize(value: string): string {
    // remove double slashes
    let sanitizedValue = value.replace(/[\/\/]{2,}/gi, '/');

    // Remove leading slash
    sanitizedValue = sanitizedValue.replace(/^\//gi, '');

    return sanitizedValue;
  }
}
