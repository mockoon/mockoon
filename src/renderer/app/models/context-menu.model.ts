import { DataSubject } from 'src/renderer/app/models/data.model';

export type ContextMenuEvent = {
  event: MouseEvent;
  items: ContextMenuItem[];
};

export type ContextMenuItemPayload = {
  subject: DataSubject;
  action:
    | 'delete'
    | 'close'
    | 'duplicate'
    | 'duplicateToEnv'
    | 'env_settings'
    | 'env_logs'
    | 'showInFolder'
    | 'export'
    | 'toggle';
  subjectUUID: string;
};

export type ContextMenuItem = {
  label: string;
  payload?: ContextMenuItemPayload;
  icon: string;
  confirmColor?: string;
  confirm?: Omit<ContextMenuItem, 'disabled'>;
  separator?: boolean;
  needConfirm?: boolean;
  disabled: boolean;
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
