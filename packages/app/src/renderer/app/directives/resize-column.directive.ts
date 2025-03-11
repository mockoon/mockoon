import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2
} from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { SettingsService } from 'src/renderer/app/services/settings.service';
import { Store } from 'src/renderer/app/stores/store';
import { Settings } from 'src/shared/models/settings.model';

export type ColumnType = 'main' | 'secondary';

/**
 * Allows the resizing of the parent element using CSS.
 * On mousedown registers listeners into the body (mousemove, mouseup) to detect resizing.
 *
 * minWidth is passed as a parameter and max is calculated based on body size and a factor.
 */

@Directive({ selector: '[appResizeColumn]' })
export class ResizeColumnDirective implements AfterViewInit {
  @Input()
  public type: ColumnType;
  @Input()
  public minWidth = 100; // min width in pixels
  @Input()
  public maxWidthFactor = 0.2; // max width based on body width percentage

  // Event removers for mousemove / mouseup events to body
  private mouseMoveRemover: () => any;
  private mouseUpRemover: () => any;
  private dragging: boolean;
  // The x point where the mousedown event occurred
  private startX: number;
  private settingProperties: Record<ColumnType, string> = {
    main: 'mainMenuSize',
    secondary: 'secondaryMenuSize'
  };
  private currentWidth: number;
  private canSaveSettings = false;

  constructor(
    private elementRef: ElementRef,
    private settingsService: SettingsService,
    private store: Store,
    private renderer: Renderer2
  ) {}

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event) {
    this.dragging = true;
    this.elementRef.nativeElement.classList.add('dragging');
    this.startX = event.x;

    this.registerListeners();
  }

  // Listen on widow size changes and apply max width
  @HostListener('window:resize', ['$event'])
  public onWindowResize() {
    this.resize();
    this.saveSettings();
  }

  ngAfterViewInit() {
    // Init and set size from settings - if that exists
    this.store
      .select('settings')
      .pipe(
        filter((settings) => !!settings),
        first()
      )
      .subscribe((settings) => {
        this.currentWidth = settings[this.settingProperties[this.type]];

        this.resize();
        this.canSaveSettings = true;
      });
  }

  /**
   * Registers event handlers to body
   * - mousemove: mark as pressed, calc and apply the new width
   * - mouseup: mark as non-pressed
   */
  private registerListeners() {
    this.mouseMoveRemover = this.renderer.listen(
      'body',
      'mousemove',
      this.handleMouseMoveEvent.bind(this)
    );
    this.mouseUpRemover = this.renderer.listen(
      'body',
      'mouseup',
      this.handleMouseUp.bind(this)
    );
  }

  private handleMouseUp() {
    if (this.dragging) {
      this.dragging = false;
      this.elementRef.nativeElement.classList.remove('dragging');
    }

    this.mouseMoveRemover();
    this.mouseUpRemover();

    this.saveSettings();
  }

  private handleMouseMoveEvent(event) {
    if (this.dragging) {
      this.currentWidth = this.currentWidth + (event.x - this.startX);
      this.resize();

      this.startX = event.x;
    }
  }

  /**
   * Resizes the parent element to the given width, applying limits if needed
   *
   * @param width
   */
  private resize() {
    // Calc max limit and apply them, if needed
    let maxWidth = document.body.offsetWidth * this.maxWidthFactor;

    // Max width should never be less that minWidth - edge case
    if (maxWidth < this.minWidth) {
      maxWidth = this.minWidth;
    }

    if (this.currentWidth < this.minWidth) {
      this.currentWidth = this.minWidth;
    } else if (this.currentWidth > maxWidth) {
      this.currentWidth = maxWidth;
    }

    this.currentWidth = Math.floor(this.currentWidth);

    const element = this.elementRef.nativeElement.parentElement;
    element.style.width = this.currentWidth + 'px';
    element.style.maxWidth = this.currentWidth + 'px';
    element.style.minWidth = this.currentWidth + 'px';
  }

  private saveSettings() {
    if (
      !this.canSaveSettings ||
      this.store.get('settings')?.[this.settingProperties[this.type]] ===
        this.currentWidth
    ) {
      return;
    }

    const newSettings: Partial<Settings> = {};
    newSettings[this.settingProperties[this.type]] = this.currentWidth;

    this.settingsService.updateSettings(newSettings);
  }
}
