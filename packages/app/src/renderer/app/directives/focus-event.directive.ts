import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { Subscription } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { EventsService } from 'src/renderer/app/services/events.service';

/**
 * Focus an input when an event is emitted with the input's name
 */
@Directive({ selector: '[appFocusOnEvent]' })
export class FocusOnEventDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private eventsService = inject(EventsService);

  @Input() public appFocusOnEvent: FocusableInputs;

  private eventsSubscription: Subscription;

  public ngOnInit() {
    this.eventsSubscription = this.eventsService.focusInput
      .pipe(
        filter((input) => input === this.appFocusOnEvent),
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
