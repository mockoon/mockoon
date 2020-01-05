import { EventEmitter, Injectable } from '@angular/core';
import { ContextMenuItem } from 'src/app/components/context-menu/context-menu.component';
import { HeadersListType } from 'src/app/components/headers-list.component';
import { CollectParams } from 'src/app/services/analytics.service';
import { Header } from 'src/app/types/route.type';

export type ContextMenuEvent = {
  event: MouseEvent;
  items: ContextMenuItem[];
};

@Injectable({ providedIn: 'root' })
export class EventsService {
  public contextMenuEvents: EventEmitter<ContextMenuEvent> = new EventEmitter();
  public settingsModalEvents: EventEmitter<any> = new EventEmitter();
  public changelogModalEvents: EventEmitter<any> = new EventEmitter();
  public analyticsEvents: EventEmitter<CollectParams> = new EventEmitter();
  public injectHeaders: EventEmitter<{
    target: HeadersListType;
    headers: Header[];
  }> = new EventEmitter();

  constructor() {}
}
