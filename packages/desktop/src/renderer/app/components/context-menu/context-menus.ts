import { Environments, Folder } from '@mockoon/commons';
import { ContextMenuItem } from 'src/renderer/app/models/context-menu.model';

export const CloudEnvironmentsContextMenu = (
  environmentUuid: string,
  syncStatus: boolean
): ContextMenuItem[] => [
  {
    payload: {
      subject: 'environment',
      action: 'duplicateToCloud',
      subjectUUID: environmentUuid
    },
    label: 'Duplicate to the cloud',
    icon: 'cloud',
    disabled: !syncStatus
  },
  {
    payload: {
      subject: 'environment',
      action: 'duplicate',
      subjectUUID: environmentUuid
    },
    label: 'Duplicate to local',
    icon: 'content_copy',
    disabled: false
  },
  {
    payload: {
      subject: 'environment',
      action: 'copyJSON',
      subjectUUID: environmentUuid
    },
    label: 'Copy configuration to clipboard (JSON)',
    icon: 'assignment',
    disabled: false
  },
  {
    payload: {
      subject: 'environment',
      action: 'showInFolder',
      subjectUUID: environmentUuid
    },
    label: 'Show local backup data file in explorer/finder',
    icon: 'folder',
    disabled: false
  },
  {
    payload: {
      subject: 'environment',
      action: 'convertToLocal',
      subjectUUID: environmentUuid
    },
    label: 'Delete from cloud and convert to local',
    icon: 'cloud_remove',
    separator: false,
    disabled: !syncStatus
  },
  {
    payload: {
      subject: 'environment',
      action: 'deleteFromCloud',
      subjectUUID: environmentUuid
    },
    label: 'Delete from cloud and close',
    icon: 'cloud_remove',
    separator: false,
    disabled: !syncStatus
  }
];

export const EnvironmentsContextMenu = (
  environmentUuid: string,
  syncStatus: boolean
): ContextMenuItem[] => [
  {
    payload: {
      subject: 'environment',
      action: 'duplicateToCloud',
      subjectUUID: environmentUuid
    },
    label: 'Duplicate to the cloud',
    icon: 'cloud',
    disabled: !syncStatus
  },
  {
    payload: {
      subject: 'environment',
      action: 'duplicate',
      subjectUUID: environmentUuid
    },
    label: 'Duplicate to local',
    icon: 'content_copy',
    disabled: false
  },
  {
    payload: {
      subject: 'environment',
      action: 'copyJSON',
      subjectUUID: environmentUuid
    },
    label: 'Copy configuration to clipboard (JSON)',
    icon: 'assignment',
    disabled: false
  },
  {
    payload: {
      subject: 'environment',
      action: 'showInFolder',
      subjectUUID: environmentUuid
    },
    label: 'Show data file in explorer/finder',
    icon: 'folder',
    disabled: false
  },
  {
    payload: {
      subject: 'environment',
      action: 'move',
      subjectUUID: environmentUuid
    },
    label: 'Move data file to folder',
    icon: 'folder_move',
    disabled: false
  },
  {
    payload: {
      subject: 'environment',
      action: 'close',
      subjectUUID: environmentUuid
    },
    label: 'Close environment',
    icon: 'close',
    disabled: false
  }
];

export const FoldersContextMenu = (folder: Folder): ContextMenuItem[] => [
  {
    payload: {
      subject: 'folder',
      action: 'add_crud_route',
      subjectUUID: folder.uuid
    },
    label: 'Add CRUD route',
    icon: 'endpoints',
    disabled: false
  },
  {
    payload: {
      subject: 'folder',
      action: 'add_http_route',
      subjectUUID: folder.uuid
    },
    label: 'Add HTTP route',
    icon: 'endpoint',
    disabled: false
  },
  {
    payload: {
      subject: 'folder',
      action: 'add_folder',
      subjectUUID: folder.uuid
    },
    label: 'Add folder',
    icon: 'folder',
    disabled: false
  },
  {
    payload: {
      subject: 'folder',
      action: 'delete',
      subjectUUID: folder.uuid
    },
    label:
      folder.children.length > 0
        ? 'Delete folder (not empty)'
        : 'Delete folder',
    icon: 'delete',
    confirm: {
      icon: 'error',
      label: 'Confirm deletion'
    },
    confirmColor: 'text-danger',
    disabled: folder.children.length > 0
  }
];

export const RoutesContextMenu = (
  routeUUID: string,
  parentId: string,
  environments: Environments
): ContextMenuItem[] => [
  {
    payload: {
      subject: 'route',
      action: 'duplicate',
      subjectUUID: routeUUID,
      parentId
    },
    label: 'Duplicate',
    icon: 'content_copy',
    disabled: false
  },
  {
    payload: {
      subject: 'route',
      action: 'duplicateToEnv',
      subjectUUID: routeUUID
    },
    label: 'Duplicate to environment',
    icon: 'input',
    disabled: environments.length <= 1
  },
  {
    payload: {
      subject: 'route',
      action: 'copyJSON',
      subjectUUID: routeUUID
    },
    label: 'Copy configuration to clipboard (JSON)',
    icon: 'assignment',
    disabled: false
  },
  {
    payload: {
      subject: 'route',
      action: 'copyFullPath',
      subjectUUID: routeUUID
    },
    label: 'Copy full path to clipboard',
    icon: 'assignment',
    disabled: false
  },
  {
    payload: {
      subject: 'route',
      action: 'toggle',
      subjectUUID: routeUUID
    },
    label: 'Toggle',
    icon: 'power_settings_new',
    disabled: false
  },
  {
    payload: {
      subject: 'route',
      action: 'delete',
      subjectUUID: routeUUID
    },
    label: 'Delete',
    icon: 'delete',
    confirm: {
      icon: 'error',
      label: 'Confirm deletion'
    },
    confirmColor: 'text-danger',
    disabled: false
  }
];

export const DatabucketsContextMenu = (
  databucketUUID: string,
  environments: Environments
): ContextMenuItem[] => [
  {
    payload: {
      subject: 'databucket',
      action: 'duplicate',
      subjectUUID: databucketUUID
    },
    label: 'Duplicate',
    icon: 'content_copy',
    disabled: false
  },
  {
    payload: {
      subject: 'databucket',
      action: 'duplicateToEnv',
      subjectUUID: databucketUUID
    },
    label: 'Duplicate to environment',
    icon: 'input',
    disabled: environments.length <= 1
  },
  {
    payload: {
      subject: 'databucket',
      action: 'copyDatabucketID',
      subjectUUID: databucketUUID
    },
    label: 'Copy ID to clipboard',
    icon: 'assignment',
    disabled: false
  },
  {
    payload: {
      subject: 'databucket',
      action: 'delete',
      subjectUUID: databucketUUID
    },
    label: 'Delete',
    icon: 'delete',
    confirm: {
      icon: 'error',
      label: 'Confirm deletion'
    },
    confirmColor: 'text-danger',
    disabled: false
  }
];

export const CallbacksContextMenu = (
  callbackUUID: string,
  environments: Environments
): ContextMenuItem[] => [
  {
    payload: {
      subject: 'callback',
      action: 'duplicate',
      subjectUUID: callbackUUID
    },
    label: 'Duplicate',
    icon: 'content_copy',
    disabled: false
  },
  {
    payload: {
      subject: 'callback',
      action: 'duplicateToEnv',
      subjectUUID: callbackUUID
    },
    label: 'Duplicate to environment',
    icon: 'input',
    disabled: environments.length <= 1
  },
  {
    payload: {
      subject: 'callback',
      action: 'delete',
      subjectUUID: callbackUUID
    },
    label: 'Delete',
    icon: 'delete',
    confirm: {
      icon: 'error',
      label: 'Confirm deletion'
    },
    confirmColor: 'text-danger',
    disabled: false
  }
];
