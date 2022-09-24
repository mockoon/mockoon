import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { ToggleItem, ToggleItems } from 'src/renderer/app/models/common.model';

/**
 * Create a single or multi toggle button.
 * Single: will act as a check box and update a boolean value.
 * Multi: will act as a radio button, possibly uncheckable (null)
 */
@Component({
  selector: 'app-toggle',
  templateUrl: 'toggle.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  @Input()
  public items: ToggleItems;
  @Input()
  public prefix: string;
  @Input()
  public label?: string;
  @Input()
  public uncheckable = true;

  public onChange: (_: any) => void;
  public onTouched: () => void;

  public control: FormControl;
  private controlChanges: Subscription;

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.control = new FormControl();

    this.controlChanges = this.control.valueChanges.subscribe(() => {
      this.onTouched();
      this.onChange(this.control.value);
    });
  }

  ngOnDestroy(): void {
    this.controlChanges.unsubscribe();
  }

  public writeValue(value: string | number | boolean): void {
    this.control.setValue(value, { emitEvent: false });

    this.changeDetectorRef.detectChanges();
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Uncheck a radio button when already active
   *
   * @param item
   * @param event
   */
  public itemClick(item: ToggleItem, event: MouseEvent) {
    if (this.uncheckable && item.value === this.control.value) {
      event.preventDefault();

      this.control.setValue(null);
    }
  }
}
