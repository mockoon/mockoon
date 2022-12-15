import { Observable, Subject } from 'rxjs';
import { DropActionType } from 'src/renderer/app/enums/ui.enum';

export enum DraggableContainers {
  ENVIRONMENTS = 'ENVIRONMENTS',
  ROUTES = 'ROUTES',
  DATABUCKETS = 'DATABUCKETS',
  ROUTE_RESPONSES = 'ROUTE_RESPONSES'
}

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

export type DropAction<T extends string | number = string | number> = {
  sourceId: T;
  sourceParentId: string | 'root';
  targetId: T;
  targetParentId: string | 'root';
  dropActionType: DropActionType;
  isSourceContainer: boolean;
  isTargetContainer: boolean;
};
