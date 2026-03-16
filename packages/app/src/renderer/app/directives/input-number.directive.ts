import {
  Directive,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  Input,
  Renderer2
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * This directive is designed to be used together with an input[type=number]
 */
@Directive({
  selector: '[appInputNumber]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputNumberDirective),
      multi: true
    }
  ]
})
export class InputNumberDirective implements ControlValueAccessor {
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);

  @Input('appInputNumber')
  public config: {
    min: number;
    max: number;
    canBeEmpty: boolean;
  };
  public onChange: (_: any) => void;
  public onTouched: (_: any) => void;

  /**
   * Prevent some characters usually accepted in an input[type=number]
   */
  @HostListener('keydown', ['$event'])
  public handleKeydown(event: KeyboardEvent): void {
    if (['e', '.', '-', '+'].includes(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Handle values entered in the input field
   */
  @HostListener('input', ['$event'])
  public handleInput(event: Event): void {
    const sanitizedValue = this.sanitize(
      (event.target as HTMLInputElement).value
    );

    this.onChange(sanitizedValue);

    this.renderer.setProperty(
      this.elementRef.nativeElement,
      'value',
      sanitizedValue
    );
  }

  /**
   * Handle writing an initial value to the input.
   * Can come as other values than number, safer to transform into a string.
   */
  public writeValue(value: number | any): void {
    const sanitizedValue = this.sanitize(String(value));

    this.renderer.setProperty(
      this.elementRef.nativeElement,
      'value',
      sanitizedValue
    );
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Sanitize the number entry:
   * - remove leading zeros and any other character.
   * - enforce min and max constraints
   */
  private sanitize(value: string): number {
    // remove everything other than numbers
    value = value.replace(/[^0-9]/g, '');
    // remove leading zero
    value = value.replace(/^0([1-9]+)/g, '$1');

    let sanitizedValue: number = parseInt(value, 10);

    if (value === undefined || value === null || value === '') {
      // if empty put Min
      if (this.config.canBeEmpty) {
        sanitizedValue = null;
      } else {
        sanitizedValue = this.config.min;
      }
    }

    // handle min/max values
    if (sanitizedValue < this.config.min) {
      sanitizedValue = this.config.min;
    }
    if (sanitizedValue > this.config.max) {
      sanitizedValue = this.config.max;
    }

    return sanitizedValue;
  }
}
