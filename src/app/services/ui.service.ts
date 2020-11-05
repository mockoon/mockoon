import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { FocusableInputs } from 'src/app/enums/ui.enum';
import { ScrollDirection } from 'src/app/models/ui.model';
import { EventsService } from 'src/app/services/events.service';
import { updateUIStateAction } from 'src/app/stores/actions';
import { Store, UIStateProperties } from 'src/app/stores/store';

@Injectable({ providedIn: 'root' })
export class UIService {
  public scrollEnvironmentsMenu: Subject<ScrollDirection> = new Subject();
  public scrollRoutesMenu: Subject<ScrollDirection> = new Subject();

  constructor(private store: Store, private eventsService: EventsService) {}

  /**
   * Scroll to bottom of an element
   *
   * @param element
   */
  public scrollToBottom(element: Element) {
    setTimeout(() => {
      element.scrollTop = element.scrollHeight;
    });
  }

  /**
   * Scroll to top of an element
   *
   * @param element
   */
  public scrollToTop(element: Element) {
    setTimeout(() => {
      element.scrollTop = 0;
    });
  }

  /**
   * Scroll an element to a direction
   *
   * @param element
   * @param direction
   */
  public scroll(element: Element, direction: ScrollDirection) {
    if (direction === ScrollDirection.TOP) {
      this.scrollToTop(element);
    } else if (direction === ScrollDirection.BOTTOM) {
      this.scrollToBottom(element);
    }
  }

  /**
   * Update the UI state with new properties
   *
   * @param newProperties
   */
  public updateUIState(newProperties: UIStateProperties) {
    this.store.update(updateUIStateAction(newProperties));
  }

  /**
   * Focus an input by name
   *
   * @param input
   */
  public focusInput(input: FocusableInputs) {
    this.eventsService.focusInput.next(input);
  }
}
