import { Injectable } from '@angular/core';
import { InFlightRequest, Transaction } from '@mockoon/commons';
import { BehaviorSubject, Subject } from 'rxjs';
import { FocusableInputs } from 'src/renderer/app/enums/ui.enum';

@Injectable({ providedIn: 'root' })
export class EventsService {
  public focusInput = new Subject<FocusableInputs>();
  public updateAvailable$ = new BehaviorSubject<string | null>(null);
  // environment UUID -> boolean
  public logsRecording$ = new BehaviorSubject<Record<string, boolean>>({});
  public serverTransaction$ = new Subject<{
    environmentUUID: string;
    transaction?: Transaction;
    inflightRequest?: InFlightRequest;
  }>();
}
