import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { ContextMenuEvent } from 'src/renderer/app/models/context-menu.model';
import { EditorModalEvent } from 'src/renderer/app/models/editor.model';
import { CollectParams } from 'src/renderer/app/services/analytics.service';

@Injectable({ providedIn: 'root' })
export class EventsService {
  public contextMenuEvents = new Subject<ContextMenuEvent>();
  public editorModalEvents: EventEmitter<EditorModalEvent> = new EventEmitter();
  public analyticsEvents: EventEmitter<CollectParams> = new EventEmitter();
  public focusInput: Subject<FocusableInputs> = new Subject();
  public updateAvailable$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  constructor() {}
}
