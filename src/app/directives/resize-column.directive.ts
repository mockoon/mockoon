import {ElementRef, Renderer2, HostListener, Directive, AfterViewInit, Input} from '@angular/core';
import {SettingsService, SettingsProperties} from '../services/settings.service';
import {Store} from 'src/app/stores/store';

export type ColumnType = 'routeMenu' | 'envLogs';

/**
 * Allows the resizing of the parent element using css(width,)
 * On mousedown registers listeners into the body (mousemove,mouseup) to detect resizing.
 *
 * Min width is passed as a parameter and max is calculated based on body size and a factor.
 */

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'resize-column'
})
export class ResizeColumnDirective implements AfterViewInit {

  constructor(private elementRef: ElementRef,
              private settingsService: SettingsService,
              private store: Store,
              private renderer: Renderer2) {
    elementRef.nativeElement.style.cursor = 'col-resize';
  }

  // Max factor to calculate max width based on body width
  private static readonly MAX_WIDTH_FACTOR = 0.8;

  @Input() type: ColumnType;
  @Input() minWidth = 100; // min width in pixels
  @Input() minWidthFromRight: number; // max width that should remain

  // Event removers for mousemove / mouseup events to body
  private mouseMoveRemover: Function;
  private mouseUpRemover: Function;

  private pressed: boolean;
  // The x point where the mousedown event occurred
  private startX;
  private startWidth;

  ngAfterViewInit() {
    // Init and set size from settings - if that exists
    const settings = this.store.get('settings');
    if (typeof settings !== 'undefined') {
      let width;
      if (this.type === 'routeMenu') {
        width = settings.routeMenuSize;
      } else {
        width = settings.envLogsSize;
      }

      if (typeof width !== 'undefined') { // finally update width if needed
        this.applyWidthCss(width);
      }
    }
  }

  @HostListener('mousedown', ['$event']) onMouseDown(event) {
    this.pressed = true;
    this.startX = event.x;
    this.startWidth = this.elementRef.nativeElement.parentElement.offsetWidth;

    this.initResizableColumns();
  }


  /**
   * Registers event handlers to body
   * - mousemove: mark as pressed, calc and apply the new width
   * - mouseup: mark as non-pressed
   */
  private initResizableColumns() {
    // this.renderer.listen('body', 'mousemove', (event) => {this.handleMouseMoveEvent(event)});
    this.mouseMoveRemover = this.renderer.listen('body', 'mousemove', this.handleMouseMoveEvent.bind(this));
    this.mouseUpRemover = this.renderer.listen('body', 'mouseup', this.handleMouseUp.bind(this));
  }

  private handleMouseUp(event) {
    if (this.pressed) {
      this.pressed = false;
    }
    // Remove event listeners
    this.mouseMoveRemover();
    this.mouseUpRemover();
  }

  private handleMouseMoveEvent(event) {
    if (this.pressed) {
      // Calc now width
      let width = this.startWidth + (event.x - this.startX);

      // Calc max limit and apply them, if needed
      let maxWidth;
      if (typeof this.minWidthFromRight !== 'undefined') {
        maxWidth = document.body.offsetWidth - this.minWidthFromRight
          - this.elementRef.nativeElement.parentElement.getBoundingClientRect().x;
      } else {
        // Use max size factor
        maxWidth = document.body.offsetWidth * ResizeColumnDirective.MAX_WIDTH_FACTOR;
      }

      // Max width should never be less that minWidth
      if (maxWidth < this.minWidth) {
        maxWidth = this.minWidth;
      }

      // Apply limits if needed
      if (width < this.minWidth) {
        width = this.minWidth;
      } else if (width > maxWidth) {
        width = maxWidth;
      }

      // Apply the new width
      this.applyWidthCss(width);
      this.saveSettings(width);
    }
  }

  private saveSettings(width: number) {
    let settingsProperties: SettingsProperties;
    if (this.type === 'routeMenu') {
      settingsProperties = {routeMenuSize: width};
    } else {
      settingsProperties = {envLogsSize: width};
    }

    this.settingsService.updateSettings(settingsProperties);
  }

  /**
   * Apply the new width to the element parameter.
   * @param width
   */
  private applyWidthCss(width) {
    const element = this.elementRef.nativeElement.parentElement;
    element.style.width = width + 'px';
    element.style.maxWidth = width + 'px';
    element.style.minWidth = width + 'px';
  }

}
