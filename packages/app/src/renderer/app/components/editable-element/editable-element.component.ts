import { NgClass, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  UntypedFormControl
} from '@angular/forms';

/**
 * Editable element (span) that switches to an input when clicked and save on Enter or blur.
 * Currently only works with string values.
 */
@Component({
  selector: 'app-editable-element',
  templateUrl: 'editable-element.component.html',
  styleUrls: ['editable-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditableElementComponent),
      multi: true
    }
  ],
  imports: [NgIf, NgClass, FormsModule, ReactiveFormsModule]
})
export class EditableElementComponent implements ControlValueAccessor {
  /**
   * Provide a complementary condition used to allow edition
   */
  @Input()
  public editCondition = true;
  @Output()
  public editChange = new EventEmitter<boolean>();

  @ViewChild('input')
  public input: ElementRef<HTMLInputElement>;

  public onChange: (_: any) => void;
  public onTouched: () => void;
  public edit = false;
  public data = new UntypedFormControl('');
  public _text: string;

  @Input()
  public set text(value: string) {
    this._text = value;
    this.data.setValue(value);
  }

  @HostListener('click', ['$event'])
  public elementClick(event: MouseEvent) {
    if (this.editCondition) {
      this.onTouched();
      this.toggleEdit(event);
    }
  }

  /**
   * Handle reactive form writing a value to the model
   *
   * @param value
   */
  public writeValue(value: string): void {
    this.data.setValue(value);
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Toggle edit mode and focus the input
   */
  public toggleEdit(event: MouseEvent) {
    event.stopPropagation();

    if (!this.edit) {
      this.edit = true;
      this.editChange.emit(true);

      setTimeout(() => {
        this.input.nativeElement.focus();
      }, 0);
    }
  }

  /**
   * Save on pressing enter key
   *
   * @param event
   */
  public keydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.save();
    }
  }

  public save() {
    // always set editing state to false and propagate to the parent
    this.editChange.emit(false);
    this.edit = false;

    // Do not save if the text is the same
    if (this._text === this.data.value) {
      return;
    }

    // save the new value and propagate to the parent
    this.text = this.data.value;
    this.onChange(this.data.value);
  }
}
