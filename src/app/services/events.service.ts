import { Injectable, EventEmitter } from '@angular/core';
import { ContextMenuItem } from 'app/components/context-menu.component';

export type ContextMenuEventType = {
  event: MouseEvent;
  items: ContextMenuItem[];
};

@Injectable()
export class EventsService {
  public contextMenuEvents: EventEmitter<ContextMenuEventType> = new EventEmitter();
  public settingsModalEvents: EventEmitter<any> = new EventEmitter();

  constructor() { }
}
