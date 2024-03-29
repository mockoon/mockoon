import { SyncActionTypes } from '../models/sync.model';

export const updatesSyncActionsList = [
  SyncActionTypes.UPDATE_ENVIRONMENT,
  SyncActionTypes.UPDATE_ROUTE,
  SyncActionTypes.UPDATE_FOLDER,
  SyncActionTypes.UPDATE_ROUTE_RESPONSE,
  SyncActionTypes.UPDATE_DATABUCKET,
  SyncActionTypes.UPDATE_CALLBACK
];

export const reorderSyncActionsList = [SyncActionTypes.REORDER_ROUTES];

export const transformableSyncActionsList = [
  ...updatesSyncActionsList,
  ...reorderSyncActionsList
];
