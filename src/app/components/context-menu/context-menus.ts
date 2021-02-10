import { ContextMenuItem } from 'src/app/models/context-menu.model';

export const EnvironmentsContextMenu = (
  environmentUUID: string
): ContextMenuItem[] => [
  {
    payload: {
      subject: 'environment',
      action: 'env_logs',
      subjectUUID: environmentUUID
    },
    label: 'Environment logs',
    icon: 'history'
  },
  {
    payload: {
      subject: 'environment',
      action: 'env_settings',
      subjectUUID: environmentUUID
    },
    label: 'Environment settings',
    icon: 'settings',
    separator: true
  },
  {
    payload: {
      subject: 'environment',
      action: 'duplicate',
      subjectUUID: environmentUUID
    },
    label: 'Duplicate',
    icon: 'content_copy'
  },
  {
    payload: {
      subject: 'environment',
      action: 'export',
      subjectUUID: environmentUUID
    },
    label: 'Copy to clipboard (JSON)',
    icon: 'assignment'
  },
  {
    payload: {
      subject: 'environment',
      action: 'delete',
      subjectUUID: environmentUUID
    },
    label: 'Delete',
    icon: 'delete',
    confirm: {
      icon: 'error',
      label: 'Confirm deletion'
    },
    confirmColor: 'text-danger'
  }
];

export const RoutesContextMenu = (routeUUID: string): ContextMenuItem[] => [
  {
    payload: {
      subject: 'route',
      action: 'duplicate',
      subjectUUID: routeUUID
    },
    label: 'Duplicate',
    icon: 'content_copy'
  },
  {
    payload: {
      subject: 'route',
      action: 'duplicateToEnv',
      subjectUUID: routeUUID
    },
    label: 'Duplicate to environment',
    icon: 'input'
  },
  {
    payload: {
      subject: 'route',
      action: 'export',
      subjectUUID: routeUUID
    },
    label: 'Copy to clipboard (JSON)',
    icon: 'assignment'
  },
  {
    payload: {
      subject: 'route',
      action: 'toggle',
      subjectUUID: routeUUID
    },
    label: 'Toggle',
    icon: 'power_settings_new'
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
    confirmColor: 'text-danger'
  }
];
