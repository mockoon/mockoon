import { EventEmitter, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HeadersListType } from 'src/app/components/headers-list.component';
import { ContextMenuEvent } from 'src/app/models/context-menu.model';
import { CollectParams } from 'src/app/services/analytics.service';
import { Header } from 'src/app/types/route.type';

@Injectable({ providedIn: 'root' })
export class EventsService {
  public contextMenuEvents = new Subject<ContextMenuEvent>();
  public settingsModalEvents: EventEmitter<any> = new EventEmitter();
  public changelogModalEvents: EventEmitter<any> = new EventEmitter();
  public analyticsEvents: EventEmitter<CollectParams> = new EventEmitter();
  public injectHeaders: EventEmitter<{
    target: HeadersListType;
    headers: Header[];
  }> = new EventEmitter();

  constructor() {}
}
