import { Injectable } from '@angular/core';
import { DragulaService } from 'ng2-dragula';
import { Subject } from 'rxjs';
import { EnvironmentsService } from 'src/app/services/environments.service';
import { updateUIStateAction } from 'src/app/stores/actions';
import { Store, UIStateProperties } from 'src/app/stores/store';
import { dragulaNamespaces as DraggableContainerNames, ScrollDirection } from 'src/app/types/ui.type';

@Injectable({ providedIn: 'root' })
export class UIService {
  public scrollEnvironmentsMenu: Subject<ScrollDirection> = new Subject();
  public scrollRoutesMenu: Subject<ScrollDirection> = new Subject();

  constructor(
    private store: Store,
    private dragulaService: DragulaService,
    private environmentsService: EnvironmentsService
  ) {
    this.initDragMonitoring();
  }

  /**
   * Trigger env/route saving and re-selection when draging active route/env
   */
  public initDragMonitoring() {
    this.dragulaService.dropModel().subscribe(dragResult => {
      this.environmentsService.moveMenuItem(
        dragResult.name as DraggableContainerNames,
        dragResult.sourceIndex,
        dragResult.targetIndex
      );
    });
  }

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
}
