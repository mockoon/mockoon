import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { ContextMenuEventType, EventsService } from 'src/app/services/events.service';
import { DataSubjectType } from 'src/app/types/data.type';

export type ContextMenuItemPayload = {
  subject: DataSubjectType;
  action: 'delete' | 'duplicate' | 'env_settings' | 'env_logs' | 'export';
  subjectUUID: string;
};

export type ContextMenuItem = {
  label: string;
  payload?: ContextMenuItemPayload;
  icon: string;
  confirmColor?: string;
  confirm?: ContextMenuItem;
  separator?: boolean;
};

export type ContextMenuPosition = {
  left: string;
  top: string;
};

@Component({
  selector: 'app-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss']
})
export class ContextMenuComponent implements OnInit {
  @Output() itemClicked: EventEmitter<ContextMenuItemPayload> = new EventEmitter();
  public show = false;
  public position: ContextMenuPosition;
  public items: ContextMenuItem[];
  public confirmIndex: number;
  private timeout: NodeJS.Timer;

  constructor(private eventsService: EventsService) { }

  ngOnInit() {
    this.eventsService.contextMenuEvents.subscribe((contextMenuEvent: ContextMenuEventType) => {
      this.position = {
        left: contextMenuEvent.event.clientX + 'px',
        top: contextMenuEvent.event.clientY + 'px'
      };

      // if risk of going outside window (100px safe zone), move from item height
      if ((contextMenuEvent.event.clientY + 100) > contextMenuEvent.event.view.innerHeight) {
        const menu = document.querySelector('.context-menu');
        // hardcode 65 in case menu is not yet visible
        const menuHeight = (menu && menu['offsetHeight']) || 65;
        this.position.top = (contextMenuEvent.event.clientY - menuHeight) + 'px';
      }

      this.items = contextMenuEvent.items;
      this.show = true;
      this.confirmIndex = undefined;

      clearTimeout(this.timeout);

      this.timeout = setTimeout(() => {
        this.reset();
      }, 4000);
    });
  }

  // close on click outside
  @HostListener('window:click', ['$event']) onInputChange(event) {
    this.reset();
  }

  public mouseLeave() {
    clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      this.reset();
    }, 4000);
  }
  public mouseEnter() {
    clearTimeout(this.timeout);
  }

  /**
   * Handle menu items clicks.
   * Stop propagation to avoid triggering window:click
   *
   * @param event
   */
  public action(item: ContextMenuItem, itemIndex: number, event: any) {
    event.stopPropagation();

    if (item.confirm && this.confirmIndex !== itemIndex) {
      this.confirmIndex = itemIndex;
    } else if (!item.confirm || this.confirmIndex === itemIndex) {
      this.itemClicked.emit(item.payload);

      this.reset();
    }
  }

  private reset() {
    this.show = false;
    this.confirmIndex = undefined;

    clearTimeout(this.timeout);
  }
}
