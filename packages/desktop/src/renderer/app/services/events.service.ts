import { Injectable } from '@angular/core';
import { InFlightRequest, Transaction } from '@mockoon/commons';
import { BehaviorSubject, Subject } from 'rxjs';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';

@Injectable({ providedIn: 'root' })
export class EventsService {
  public focusInput: Subject<FocusableInputs> = new Subject();
  public updateAvailable$: BehaviorSubject<string | null> = new BehaviorSubject(
    null
  );
  // environment UUID -> boolean
  public logsRecording$: BehaviorSubject<{ [key in string]: boolean }> =
    new BehaviorSubject({});
  public serverTransaction$: Subject<{
    environmentUUID: string;
    transaction?: Transaction;
    inflightRequest?: InFlightRequest;
  }> = new Subject();

  constructor() {}
}
