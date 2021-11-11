import { Environments } from '@mockoon/commons';
import { ContextMenuItem } from 'src/renderer/app/models/context-menu.model';

export const EnvironmentsContextMenu = (
  environmentUUID: string
): ContextMenuItem[] => [
  {
    payload: {
      subject: 'environment',
      action: 'duplicate',
      subjectUUID: environmentUUID
    },
    label: 'Duplicate',
    icon: 'content_copy',
    disabled: false
  },
  {
    payload: {
      subject: 'environment',
      action: 'export',
      subjectUUID: environmentUUID
    },
    label: 'Copy to clipboard (JSON)',
    icon: 'assignment',
    separator: true,
    disabled: false
  },
  {
    payload: {
      subject: 'environment',
      action: 'showInFolder',
      subjectUUID: environmentUUID
    },
    label: 'Show in folder',
    icon: 'folder',
    separator: true,
    disabled: false
  },
  {
    payload: {
      subject: 'environment',
      action: 'close',
      subjectUUID: environmentUUID
    },
    label: 'Close environment',
    icon: 'close',
    disabled: false
  }
];

export const RoutesContextMenu = (
  routeUUID: string,
  environments: Environments
): ContextMenuItem[] => [
  {
    payload: {
      subject: 'route',
      action: 'duplicate',
      subjectUUID: routeUUID
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
      action: 'export',
      subjectUUID: routeUUID
    },
    label: 'Copy to clipboard (JSON)',
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
