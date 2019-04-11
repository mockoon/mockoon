import { EventEmitter, Injectable } from '@angular/core';
import { ContextMenuItem } from 'src/app/components/context-menu.component';
import { HeadersListType } from 'src/app/components/headers-list.component';
import { CollectParams } from 'src/app/services/analytics.service';
import { HeaderType } from 'src/app/types/route.type';

export type ContextMenuEventType = {
  event: MouseEvent;
  items: ContextMenuItem[];
};

@Injectable()
export class EventsService {
  public contextMenuEvents: EventEmitter<ContextMenuEventType> = new EventEmitter();
  public settingsModalEvents: EventEmitter<any> = new EventEmitter();
  public changelogModalEvents: EventEmitter<any> = new EventEmitter();
  public analyticsEvents: EventEmitter<CollectParams> = new EventEmitter();
  public injectHeaders: EventEmitter<{ target: HeadersListType, headers: HeaderType[] }> = new EventEmitter();

  constructor() { }
}
