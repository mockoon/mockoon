import { DataSubject } from 'src/renderer/app/models/data.model';

export type ContextMenuEvent = {
  event: MouseEvent;
  items: ContextMenuItem[];
};

export type ContextMenuItemPayload = {
  subject: DataSubject;
  action:
    | 'add_crud_route'
    | 'add_http_route'
    | 'add_folder'
    | 'delete'
    | 'close'
    | 'duplicate'
    | 'duplicateToEnv'
    | 'env_settings'
    | 'env_logs'
    | 'showInFolder'
    | 'move'
    | 'copyJSON'
    | 'copyFullPath'
    | 'copyDatabucketID'
    | 'toggle';
  subjectUUID: string;
  parentId?: string | 'root';
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
