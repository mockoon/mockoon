import { Observable, Subject } from 'rxjs';

export type DragState = {
  // id of the dragged element (UUID or index)
  elementId: number | string;
  // arbitrary name of the dragged element's container (avoid drag and drop between different containers)
  dragContainer: string;
  // Id of the dragged element's parent or 'root'
  parentId: string | 'root';
  // Is the dragged element a container (can contain other elements like a folder)
  isContainer: boolean;
  nativeElement: HTMLElement;
};

export type ConfirmModalPayload = {
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

export type EditorModalPayload = {
  title: string;
  subtitle?: string;
  text: string;
};

export type ManageInstancesModalPayload = {
  environmentUuid?: string;
  refresh: boolean;
};

export type OpenApiImportModalPayload = {
  cloud: boolean;
};
