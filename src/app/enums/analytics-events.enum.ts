import { CollectParams } from 'src/app/services/analytics.service';

type AnalyticsEventsNames =
  | 'PAGEVIEW'
  | 'APPLICATION_START'
  | 'APPLICATION_FIRST_LOAD'
  | 'SERVER_START'
  | 'CREATE_ENVIRONMENT'
  | 'CREATE_ROUTE'
  | 'EXPORT_FILE'
  | 'EXPORT_OPENAPI'
  | 'EXPORT_CLIPBOARD'
  | 'IMPORT_FILE'
  | 'IMPORT_OPENAPI'
  | 'IMPORT_CLIPBOARD'
  | 'SERVER_ENTERING_REQUEST'
  | 'CREATE_ROUTE_FROM_LOG';

export const AnalyticsEvents: {
  [keyof in AnalyticsEventsNames]: CollectParams;
} = {
  PAGEVIEW: { type: 'pageview', pageName: '/' },
  APPLICATION_START: {
    type: 'event',
    category: 'application',
    action: 'start'
  },
  APPLICATION_FIRST_LOAD: {
    type: 'event',
    category: 'application',
    action: 'first-load'
  },
  SERVER_START: { type: 'event', category: 'server', action: 'start' },
  CREATE_ENVIRONMENT: {
    type: 'event',
    category: 'create',
    action: 'environment'
  },
  CREATE_ROUTE: { type: 'event', category: 'create', action: 'route' },
  EXPORT_FILE: { type: 'event', category: 'export', action: 'file' },
  EXPORT_OPENAPI: { type: 'event', category: 'export', action: 'openapi-file' },
  EXPORT_CLIPBOARD: { type: 'event', category: 'export', action: 'clipboard' },
  IMPORT_FILE: { type: 'event', category: 'import', action: 'file' },
  IMPORT_OPENAPI: { type: 'event', category: 'import', action: 'openapi-file' },
  IMPORT_CLIPBOARD: { type: 'event', category: 'import', action: 'clipboard' },
  SERVER_ENTERING_REQUEST: {
    type: 'event',
    category: 'server',
    action: 'entering-request'
  },
  CREATE_ROUTE_FROM_LOG: {
    type: 'event',
    category: 'create',
    action: 'route-from-log'
  }
};
