import { ContextMenuItem } from 'src/app/components/context-menu.component';

export const EnvironmentsContextMenuItems = (subjectUUID: string): ContextMenuItem[] => [
  {
    payload: {
      subject: 'environment',
      action: 'env_logs',
      subjectUUID
    },
    label: 'Environment logs',
    icon: 'history'
  },
  {
    payload: {
      subject: 'environment',
      action: 'env_settings',
      subjectUUID
    },
    label: 'Environment settings',
    icon: 'settings',
    separator: true
  },
  {
    payload: {
      subject: 'environment',
      action: 'duplicate',
      subjectUUID
    },
    label: 'Duplicate environment',
    icon: 'content_copy'
  },
  {
    payload: {
      subject: 'environment',
      action: 'export',
      subjectUUID
    },
    label: 'Copy to clipboard (JSON)',
    icon: 'assignment'
  },
  {
    payload: {
      subject: 'environment',
      action: 'delete',
      subjectUUID
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
