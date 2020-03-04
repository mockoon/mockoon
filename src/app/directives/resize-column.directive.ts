import {ElementRef, Renderer2, Directive, AfterViewInit} from '@angular/core';


/**
 * Allows the resizing of the parent element using css(width,)
 * On mousedown registers listeners into the body (mousemove,mouseup) to detect resizing.
 *
 * Also there is a min/max factor defined based on body size percentage.
 */
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'resize-column'
})
export class ResizeColumnDirective implements AfterViewInit {
  // Factors which defines min and max size based on body width
  private static MIN_WIDTH_FACTOR = 0.1;
  private static MAX_WIDTH_FACTOR = 0.8;

  private startElement: HTMLElement;
  private pressed: boolean;
  // The x point where the mousedown occurred
  private startX;
  private startWidth;


  /**
   * Apply the new width to the element parameter.
   * @param element
   * @param width
   */
  private static applyWidthCss(element: HTMLElement, width) {
    element.style.width = width + 'px';
    element.style.maxWidth = width + 'px';
    element.style.minWidth = width + 'px';
  }

  constructor(private elementRef: ElementRef,
              private renderer: Renderer2) {
    elementRef.nativeElement.style.cursor = 'col-resize';
  }

  // ngOnInit() {}

  ngAfterViewInit() {
    this.elementRef.nativeElement.addEventListener('mousedown', this.onMouseDown.bind(this));
  }

  /**
   * Handle mousedown event
   * @param event
   */
  private onMouseDown(event) {
    this.startElement = event.target;
    this.pressed = true;
    this.startX = event.x;
    this.startWidth = this.startElement.parentElement.offsetWidth;

    this.initResizableColumns();
  }

  /**
   * Registers event handlers to body
   * - mousemove: mark as pressed, calc and apply the new width
   * - mouseup: mark as non-pressed
   */
  private initResizableColumns() {
    this.renderer.listen('body', 'mousemove', (event) => {
      if (this.pressed) {
        // Calc now width
        let width = this.startWidth + (event.x - this.startX);

        // Calc min-max limits and apply them, if needed
        const minWidth = document.body.offsetWidth * ResizeColumnDirective.MIN_WIDTH_FACTOR;
        const maxWidth = document.body.offsetWidth * ResizeColumnDirective.MAX_WIDTH_FACTOR;
        if (width < minWidth) {
          width = minWidth;
        } else if (width > maxWidth) {
          width = maxWidth;
        }

        // Apply the new width
        ResizeColumnDirective.applyWidthCss(this.startElement.parentElement, width);
      }
    });

    this.renderer.listen('body', 'mouseup', (event) => {
      if (this.pressed) {
        this.pressed = false;
      }
    });
  }


}
