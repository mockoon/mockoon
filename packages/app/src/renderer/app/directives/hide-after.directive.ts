import { Directive, ElementRef, Input, OnInit, inject } from '@angular/core';

/**
 * Hide an element after a delay (in ms)
 */
@Directive({ selector: '[appHideAfter]' })
export class HideAfterDirective implements OnInit {
  private elementRef = inject<ElementRef<HTMLDivElement>>(ElementRef);

  // Delay in ms
  @Input() public appHideAfter: number;

  ngOnInit(): void {
    setTimeout(() => {
      this.elementRef.nativeElement.remove();
    }, this.appHideAfter);
  }
}
