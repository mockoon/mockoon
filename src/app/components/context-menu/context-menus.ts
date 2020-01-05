import { ContextMenuItem } from 'src/app/components/context-menu/context-menu.component';

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
    label: 'Duplicate environment',
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
    label: 'Delete environment',
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
    label: 'Duplicate route',
    icon: 'content_copy'
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
    label: 'Toggle Route',
    icon: 'power_settings_new'
  },
  {
    payload: {
      subject: 'route',
      action: 'delete',
      subjectUUID: routeUUID
    },
    label: 'Delete route',
    icon: 'delete',
    confirm: {
      icon: 'error',
      label: 'Confirm deletion'
    },
    confirmColor: 'text-danger'
  }
];
