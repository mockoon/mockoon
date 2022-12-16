import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnDestroy
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';

/**
 * Directive to make an element hideable depending on a search string.
 * Search string can contain words separated by spaces. All have to be found in the element's text.
 */
@Directive({ selector: '[appSearchFilter]' })
export class SearchFilterDirective implements AfterViewInit, OnDestroy {
  @Input('appSearchFilter')
  public filter$: Observable<string>;
  private subscription: Subscription;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngAfterViewInit() {
    this.filter$.subscribe((filter) => {
      if (!filter) {
        this.elementRef.nativeElement.classList.remove('d-none');

        return;
      }

      // verify that each word of the filter is present in the element's text
      const matches = filter
        .split(' ')
        .filter((filterWord) => !!filterWord)
        .every(
          (filterWord) =>
            !!filterWord &&
            this.elementRef.nativeElement.innerText
              .toLowerCase()
              .includes(filterWord.toLowerCase())
        );

      this.elementRef.nativeElement.classList.toggle('d-none', !matches);
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
