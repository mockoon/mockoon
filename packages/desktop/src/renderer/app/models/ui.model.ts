import { Observable, Subject } from 'rxjs';

export type DraggableContainerNames =
  | 'routes'
  | 'environments'
  | 'routeResponses';

export enum ScrollDirection {
  TOP = 'TOP',
  BOTTOM = 'BOTTOM'
}

export type ConfirmModalEvent = {
  title: string;
  text: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  sub?: string;
  subIcon?: string;
  subIconClass?: string;
  // display an optional list of strings in the confirm modal
  list$?: Observable<string[]>;
  confirmed$: Subject<boolean>;
};
