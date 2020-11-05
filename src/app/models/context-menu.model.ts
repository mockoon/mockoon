import { DataSubject } from 'src/app/models/data.model';

export type ContextMenuEvent = {
  event: MouseEvent;
  items: ContextMenuItem[];
};

export type ContextMenuItemPayload = {
  subject: DataSubject;
  action:
    | 'delete'
    | 'duplicate'
    | 'env_settings'
    | 'env_logs'
    | 'export'
    | 'toggle';
  subjectUUID: string;
};

export type ContextMenuItem = {
  label: string;
  payload?: ContextMenuItemPayload;
  icon: string;
  confirmColor?: string;
  confirm?: ContextMenuItem;
  separator?: boolean;
  needConfirm?: boolean;
};

export type ContextMenuPosition = {
  left: string;
  top: string;
};

export type ContentMenuState = {
  show: boolean;
  items: ContextMenuItem[];
  position: ContextMenuPosition;
  confirmIndex: number;
};
