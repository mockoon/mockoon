import { AfterViewInit, Directive, ElementRef, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * This directive is used to scroll the element into view when it becomes active (class added) or when the element is created with the active class (element insertion, click or class change from outside, like the command palette).
 */
@Directive({
  selector: '[appScrollWhenActive]'
})
export class ScrollWhenActiveDirective implements AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private mutationObserver = new MutationObserver(
    this.observeClassChanges.bind(this)
  );

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    this.mutationObserver.observe(this.elementRef.nativeElement, {
      attributes: true
    });

    this.scrollIntoView();
  }

  ngOnDestroy() {
    this.mutationObserver.disconnect();
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  private observeClassChanges(mutations: MutationRecord[]) {
    mutations.forEach((mutation) => {
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'class'
      ) {
        this.scrollIntoView();
      }
    });
  }

  private scrollIntoView() {
    if (this.elementRef.nativeElement.classList.contains('active')) {
      setTimeout(() => {
        this.elementRef.nativeElement.scrollIntoView({
          behavior: 'instant',
          block: 'nearest',
          inline: 'nearest'
        });
      }, 0);
    }
  }
}
