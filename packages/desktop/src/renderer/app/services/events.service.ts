import { EventEmitter, Injectable } from '@angular/core';
import { Header, Transaction } from '@mockoon/commons';
import { BehaviorSubject, Subject } from 'rxjs';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';
import { ContextMenuEvent } from 'src/renderer/app/models/context-menu.model';
import { DataSubject } from 'src/renderer/app/models/data.model';
import { EditorModalEvent } from 'src/renderer/app/models/editor.model';
import { ConfirmModalEvent } from 'src/renderer/app/models/ui.model';

@Injectable({ providedIn: 'root' })
export class EventsService {
  public contextMenuEvents = new Subject<ContextMenuEvent>();
  public injectHeaders$ = new Subject<{
    dataSubject: DataSubject;
    headers: Header[];
  }>();
  public editorModalEvents: EventEmitter<EditorModalEvent> = new EventEmitter();
  public authModalEvents: EventEmitter<void> = new EventEmitter();
  public templatesModalEvents: EventEmitter<void> = new EventEmitter();
  public confirmModalEvents = new BehaviorSubject<ConfirmModalEvent>(null);
  public generatingTemplate$ = new BehaviorSubject<
    'INPROGRESS' | 'DONE' | 'NONE'
  >('NONE');
  public focusInput: Subject<FocusableInputs> = new Subject();
  public updateAvailable$: BehaviorSubject<string | null> = new BehaviorSubject(
    null
  );
  // environment UUID -> boolean
  public logsRecording$: BehaviorSubject<{ [key in string]: boolean }> =
    new BehaviorSubject({});
  public serverTransaction$: Subject<{
    environmentUUID: string;
    transaction: Transaction;
  }> = new Subject();

  constructor() {}
}
