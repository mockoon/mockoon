import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { FocusableInputs } from 'src/app/enums/ui.enum';
import { EventsService } from 'src/app/services/events.service';

/**
 * Focus an input when an event is emitted with the input's name
 */
@Directive({
  selector: '[focusOnEvent]'
})
export class FocusOnEventDirective implements OnInit, OnDestroy {
  @Input() public focusOnEvent: FocusableInputs;

  private eventsSubscription: Subscription;

  constructor(
    private elementRef: ElementRef,
    private eventsService: EventsService
  ) {}

  public ngOnInit() {
    this.eventsSubscription = this.eventsService.focusInput
      .pipe(
        filter((input) => input === this.focusOnEvent),
        tap(() => {
          this.elementRef.nativeElement.focus();
        })
      )
      .subscribe();
  }

  public ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }
}
