import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import 'brace';
import { Editor, UndoManager } from 'brace';
import 'brace/ext/language_tools';
import 'brace/ext/searchbox';
import 'brace/index';
import 'brace/mode/css';
import 'brace/mode/html.js';
import 'brace/mode/json.js';
import 'brace/mode/text.js';
import 'brace/mode/xml.js';
import 'brace/mode/yaml.js';
import '../../../assets/editor-theme.js';

declare const ace: any;

/**
 * Ace editor component taken from
 * https://github.com/fxmontigny/ng2-ace-editor
 */
@Component({
  selector: 'app-editor',
  template: '',
  styles: [':host { display:block; width:100%; height:100%; }'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditorComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  private zone = inject(NgZone);

  @Output()
  public textChanged = new EventEmitter();
  @Output()
  public textChange = new EventEmitter();
  @Input()
  public style = {};
  public oldText: any;
  public timeoutSaving: any;
  private _options = {};
  private _readOnly = false;
  private _hideInterface = false;
  private _mode = 'text';
  private _autoUpdateContent = true;
  private _editor: Editor;
  private _durationBeforeCallback = 0;
  private _text = '';
  private emitChanges = true;

  constructor() {
    const elementRef = inject(ElementRef);

    const element = elementRef.nativeElement;
    this.zone.runOutsideAngular(() => {
      this._editor = ace['edit'](element);
    });
    this._editor.$blockScrolling = Infinity;

    // Remove ctrl-p key binding to avoid conflict with command palette
    (this._editor.commands as any).removeCommand({
      name: 'jumptomatching',
      bindKey: {
        win: 'Ctrl-P',
        mac: 'Command-P'
      },
      exec: () => {
        // Do nothing to effectively disable the key binding
      }
    });
    // Remove ctrl-, key binding to avoid conflict with settings modal
    (this._editor.commands as any).removeCommand({
      name: 'showSettingsMenu',
      bindKey: {
        win: 'Ctrl-,',
        mac: 'Command-,'
      },
      exec: () => {
        // Do nothing to effectively disable the key binding
      }
    });
  }

  public get text() {
    return this._text;
  }

  public get value() {
    return this.text;
  }

  @Input()
  public set text(text: string) {
    this.setText(text);
  }

  @Input()
  public set value(value: string) {
    this.setText(value);
  }

  /**
   * When uuid changes, reset undo state
   */
  @Input()
  public set uuid(uuid: string) {
    this._editor.getSession().setUndoManager(new UndoManager());
  }

  @Input()
  public set options(options: any) {
    this.setOptions(options);
  }

  @Input()
  public set mode(mode: any) {
    this.setMode(mode);
  }

  @Input()
  public set readOnly(readOnly: any) {
    this.setReadOnly(readOnly);
  }

  @Input()
  public set hideCursor(hideCursor: any) {
    this.setHideInterface(hideCursor);
  }

  @Input()
  public set autoUpdateContent(status: any) {
    this.setAutoUpdateContent(status);
  }

  @Input()
  public set durationBeforeCallback(num: number) {
    this.setDurationBeforeCallback(num);
  }

  ngOnInit() {
    this.init();
    this.initEvents();
  }

  ngOnDestroy() {
    this._editor.destroy();
  }

  public onChange = (_: any) => {
    // required by ControlValueAccessor
  };

  public registerOnChange(fn: any) {
    this.onChange = fn;
  }

  public onTouched = () => {
    // required by ControlValueAccessor
  };

  public registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  public writeValue(value: any) {
    this.setText(value, false);
  }

  private init() {
    this.setOptions(this._options || {});
    this._editor.setTheme('ace/theme/editor-theme');
    this.setMode(this._mode);
    this.setReadOnly(this._readOnly);
  }

  private initEvents() {
    this._editor.on('change', () => this.updateText());
    this._editor.on('paste', () => this.updateText());
  }

  private updateText() {
    if (!this.emitChanges) {
      return;
    }

    const newVal = this._editor.getValue();

    if (newVal === this.oldText) {
      return;
    }

    if (!this._durationBeforeCallback) {
      this._text = newVal;
      this.zone.run(() => {
        this.textChange.emit(newVal);
        this.textChanged.emit(newVal);
      });
      this.onChange(newVal);
    } else {
      if (this.timeoutSaving) {
        clearTimeout(this.timeoutSaving);
      }

      this.timeoutSaving = setTimeout(() => {
        this._text = newVal;
        this.zone.run(() => {
          this.textChange.emit(newVal);
          this.textChanged.emit(newVal);
        });
        this.timeoutSaving = null;
      }, this._durationBeforeCallback);
    }
    this.oldText = newVal;
  }

  private setOptions(options: any) {
    this._options = options;
    this._editor.setOptions(options || {});
  }

  private setReadOnly(readOnly: any) {
    this._readOnly = readOnly;
    this._editor.setReadOnly(readOnly);
  }

  private setHideInterface(hideInterface: any) {
    this._hideInterface = hideInterface;

    this._editor.renderer.setShowGutter(!hideInterface);
    (this._editor.renderer as any).$cursorLayer.element.style.display = 'none';
  }

  private setMode(mode: any) {
    this._mode = mode;
    if (typeof this._mode === 'object') {
      this._editor.getSession().setMode(this._mode);
    } else {
      this._editor.getSession().setMode(`ace/mode/${this._mode}`);
    }
  }

  private setText(text: any, emit = true) {
    if (text === null || text === undefined) {
      text = '';
    }
    if (this._text !== text && this._autoUpdateContent === true) {
      this._text = text;

      this.emitChanges = false;
      this._editor.setValue(text);
      this.emitChanges = true;

      if (emit) {
        this.onChange(text);
      }

      this._editor.clearSelection();
    }
  }

  private setAutoUpdateContent(status: any) {
    this._autoUpdateContent = status;
  }

  private setDurationBeforeCallback(num: number) {
    this._durationBeforeCallback = num;
  }

  private getEditor() {
    return this._editor;
  }
}
