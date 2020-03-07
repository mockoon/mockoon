import { CollectParams } from 'src/app/services/analytics.service';

type AnalyticsEventsNames =
  | 'PAGEVIEW'
  | 'APPLICATION_START'
  | 'APPLICATION_FIRST_LOAD'
  | 'SERVER_STOP'
  | 'SERVER_RESTART'
  | 'SERVER_START'
  | 'NAVIGATE_ENVIRONMENT'
  | 'NAVIGATE_ROUTE'
  | 'CREATE_ENVIRONMENT'
  | 'CREATE_ROUTE'
  | 'CREATE_ROUTE_RESPONSE'
  | 'CREATE_HEADER'
  | 'DUPLICATE_ENVIRONMENT'
  | 'DUPLICATE_ROUTE'
  | 'DELETE_ENVIRONMENT'
  | 'DELETE_ROUTE'
  | 'DELETE_ROUTE_RESPONSE'
  | 'DELETE_HEADER'
  | 'LINK_ROUTE_IN_BROWSER'
  | 'LINK_FEEDBACK'
  | 'LINK_RELEASE'
  | 'LINK_WIKI'
  | 'LINK_APPLY_UPDATE'
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
  SERVER_STOP: { type: 'event', category: 'server', action: 'stop' },
  SERVER_RESTART: { type: 'event', category: 'server', action: 'restart' },
  SERVER_START: { type: 'event', category: 'server', action: 'start' },
  NAVIGATE_ENVIRONMENT: {
    type: 'event',
    category: 'navigate',
    action: 'environment'
  },
  NAVIGATE_ROUTE: { type: 'event', category: 'navigate', action: 'route' },
  CREATE_ENVIRONMENT: {
    type: 'event',
    category: 'create',
    action: 'environment'
  },
  CREATE_ROUTE: { type: 'event', category: 'create', action: 'route' },
  CREATE_ROUTE_RESPONSE: {
    type: 'event',
    category: 'create',
    action: 'route-response'
  },
  CREATE_HEADER: { type: 'event', category: 'create', action: 'header' },
  DUPLICATE_ENVIRONMENT: {
    type: 'event',
    category: 'duplicate',
    action: 'environment'
  },
  DUPLICATE_ROUTE: { type: 'event', category: 'duplicate', action: 'route' },
  DELETE_ENVIRONMENT: {
    type: 'event',
    category: 'delete',
    action: 'environment'
  },
  DELETE_ROUTE: { type: 'event', category: 'delete', action: 'route' },
  DELETE_ROUTE_RESPONSE: {
    type: 'event',
    category: 'delete',
    action: 'route-response'
  },
  DELETE_HEADER: { type: 'event', category: 'delete', action: 'header' },
  LINK_ROUTE_IN_BROWSER: {
    type: 'event',
    category: 'link',
    action: 'route-in-browser'
  },
  LINK_FEEDBACK: { type: 'event', category: 'link', action: 'feedback' },
  LINK_RELEASE: { type: 'event', category: 'link', action: 'release' },
  LINK_WIKI: { type: 'event', category: 'link', action: 'wiki' },
  LINK_APPLY_UPDATE: {
    type: 'event',
    category: 'link',
    action: 'apply-update'
  },
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
