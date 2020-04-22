import { EventEmitter, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ContextMenuEvent } from 'src/app/models/context-menu.model';
import { CollectParams } from 'src/app/services/analytics.service';

@Injectable({ providedIn: 'root' })
export class EventsService {
  public contextMenuEvents = new Subject<ContextMenuEvent>();
  public settingsModalEvents: EventEmitter<any> = new EventEmitter();
  public changelogModalEvents: EventEmitter<any> = new EventEmitter();
  public analyticsEvents: EventEmitter<CollectParams> = new EventEmitter();

  constructor() {}
}
