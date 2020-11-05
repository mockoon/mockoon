import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2
} from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { SettingsProperties } from 'src/app/models/settings.model';
import { SettingsService } from 'src/app/services/settings.service';
import { Store } from 'src/app/stores/store';

export type ColumnType = 'routeMenu' | 'envLogs';

/**
 * Allows the resizing of the parent element using CSS.
 * On mousedown registers listeners into the body (mousemove, mouseup) to detect resizing.
 *
 * minWidth is passed as a parameter and max is calculated based on body size and a factor.
 */

@Directive({
  selector: 'resize-column'
})
export class ResizeColumnDirective implements AfterViewInit {
  @Input()
  public type: ColumnType;
  @Input()
  public minWidth = 100; // min width in pixels
  @Input()
  public maxWidthFactor = 0.2; // max width based on body width percentage

  // Event removers for mousemove / mouseup events to body
  private mouseMoveRemover: Function;
  private mouseUpRemover: Function;

  private pressed: boolean;
  // The x point where the mousedown event occurred
  private startX: number;
  private startWidth: number;

  constructor(
    private elementRef: ElementRef,
    private settingsService: SettingsService,
    private store: Store,
    private renderer: Renderer2
  ) {}

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event) {
    this.pressed = true;
    this.startX = event.x;
    this.startWidth = this.elementRef.nativeElement.parentElement.offsetWidth;

    this.initResizableColumns();
  }

  // Listen on widow size changes and apply max width
  @HostListener('window:resize', ['$event'])
  public onWindowResize(event) {
    this.applyLimits(this.elementRef.nativeElement.parentElement.offsetWidth);
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
        let width: number;

        if (this.type === 'routeMenu') {
          width = settings.routeMenuSize;
        } else {
          width = settings.logsMenuSize;
        }

        if (typeof width !== 'undefined') {
          // finally update width if needed
          this.applyLimits(width);
        }
      });
  }

  /**
   * Registers event handlers to body
   * - mousemove: mark as pressed, calc and apply the new width
   * - mouseup: mark as non-pressed
   */
  private initResizableColumns() {
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
      const width = this.startWidth + (event.x - this.startX);
      this.applyLimits(width);
    }
  }

  /**
   * Apply limits width to parent element.
   *
   * @param width
   */
  private applyLimits(width: number) {
    // Calc max limit and apply them, if needed
    let maxWidth = document.body.offsetWidth * this.maxWidthFactor;

    // Max width should never be less that minWidth - edge case
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

  private saveSettings(width: number) {
    let settingsProperties: SettingsProperties;
    if (this.type === 'routeMenu') {
      settingsProperties = { routeMenuSize: width };
    } else {
      settingsProperties = { logsMenuSize: width };
    }

    this.settingsService.updateSettings(settingsProperties);
  }

  /**
   * Apply the new width to the element parameter.
   *
   * @param width
   */
  private applyWidthCss(width: number) {
    const element = this.elementRef.nativeElement.parentElement;
    element.style.width = width + 'px';
    element.style.maxWidth = width + 'px';
    element.style.minWidth = width + 'px';
  }
}
