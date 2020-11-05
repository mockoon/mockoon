import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  OnInit,
  Output
} from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ContentMenuState,
  ContextMenuItem,
  ContextMenuItemPayload
} from 'src/app/models/context-menu.model';
import { EventsService } from 'src/app/services/events.service';

@Component({
  selector: 'app-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextMenuComponent implements OnInit {
  @Output()
  public itemClicked: EventEmitter<ContextMenuItemPayload> = new EventEmitter();
  public menuState$: Observable<ContentMenuState>;
  private timeout: NodeJS.Timer;

  constructor(private eventsService: EventsService) {}

  // close on click outside
  @HostListener('window:click')
  public onInputChange() {
    this.reset();
  }

  ngOnInit() {
    this.menuState$ = this.eventsService.contextMenuEvents.pipe(
      map((contextMenuEvent) => {
        if (!contextMenuEvent) {
          return null;
        }

        const menuState = {
          position: {
            left: contextMenuEvent.event.clientX + 'px',
            top: contextMenuEvent.event.clientY + 'px'
          },
          items: contextMenuEvent.items,
          show: true,
          confirmIndex: undefined
        };
        const menuHeight = this.calculateMenuHeight(contextMenuEvent.items);

        // if risk of going outside window, move top from menu height
        if (
          contextMenuEvent.event.clientY + menuHeight >
          contextMenuEvent.event.view.innerHeight
        ) {
          menuState.position.top =
            contextMenuEvent.event.clientY - menuHeight + 'px';
        }

        this.restartTimeout();

        return menuState;
      })
    );
  }

  public mouseLeave() {
    this.restartTimeout();
  }

  public mouseEnter() {
    clearTimeout(this.timeout);
  }

  /**
   * Handle menu items clicks.
   * Stop propagation to avoid triggering window:click
   *
   * @param item
   * @param event
   */
  public action(item: ContextMenuItem, event: any) {
    event.stopPropagation();

    if (item.confirm && !item.needConfirm) {
      item.needConfirm = true;
    } else if (!item.confirm || item.needConfirm) {
      this.itemClicked.emit(item.payload);

      this.reset();
    }
  }

  /**
   * Reset the menu state
   */
  private reset() {
    this.eventsService.contextMenuEvents.next(null);

    clearTimeout(this.timeout);
  }

  /**
   * Calculate the menu height depending on number of items
   *
   * @param items
   */
  private calculateMenuHeight(items: ContextMenuItem[]): number {
    return items.length * 35;
  }

  /**
   * Restart the closing timeout
   */
  private restartTimeout() {
    clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      this.reset();
    }, 4000);
  }
}
