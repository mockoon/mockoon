import { Directive, ElementRef, Input, OnInit } from '@angular/core';

/**
 * Hide an element after a delay (in ms)
 */
@Directive({ selector: '[appHideAfter]' })
export class HideAfterDirective implements OnInit {
  // Delay in ms
  @Input() public appHideAfter: number;

  constructor(private elementRef: ElementRef<HTMLDivElement>) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.elementRef.nativeElement.remove();
    }, this.appHideAfter);
  }
}
