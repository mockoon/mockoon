import {
  reorderSyncActionsList,
  transformableSyncActionsList
} from '../constants/sync.constants';
import {
  RecentActionsStore,
  ReorderSyncActions,
  SyncActionTypes,
  SyncActions,
  TransformableSyncActions
} from '../models/sync.model';

const setRouteResponseDefault = 'SET_RESPONSE_DEFAULT';

export function buildSyncActionKey(
  syncAction: TransformableSyncActions
): string {
  switch (syncAction.type) {
    case SyncActionTypes.UPDATE_ENVIRONMENT:
      return SyncActionTypes.UPDATE_ENVIRONMENT + syncAction.environmentUuid;

    case SyncActionTypes.UPDATE_ROUTE:
      return (
        SyncActionTypes.UPDATE_ROUTE +
        syncAction.environmentUuid +
        syncAction.routeUuid
      );

    case SyncActionTypes.UPDATE_FOLDER:
      return (
        SyncActionTypes.UPDATE_FOLDER +
        syncAction.environmentUuid +
        syncAction.folderUuid
      );

    case SyncActionTypes.UPDATE_ROUTE_RESPONSE: {
      if (syncAction.properties.default !== undefined) {
        return (
          SyncActionTypes.UPDATE_ROUTE_RESPONSE +
          syncAction.environmentUuid +
          syncAction.routeUuid +
          setRouteResponseDefault
        );
      } else {
        return (
          SyncActionTypes.UPDATE_ROUTE_RESPONSE +
          syncAction.environmentUuid +
          syncAction.routeUuid +
          syncAction.routeResponseUuid
        );
      }
    }

    case SyncActionTypes.UPDATE_DATABUCKET:
      return (
        SyncActionTypes.UPDATE_DATABUCKET +
        syncAction.environmentUuid +
        syncAction.databucketUuid
      );

    case SyncActionTypes.UPDATE_CALLBACK:
      return (
        SyncActionTypes.UPDATE_CALLBACK +
        syncAction.environmentUuid +
        syncAction.callbackUuid
      );

    case SyncActionTypes.REORDER_ROUTES:
      return SyncActionTypes.REORDER_ROUTES + syncAction.reorderAction.sourceId;
  }
}

function isTransformableSyncAction(
  syncAction: SyncActions
): syncAction is TransformableSyncActions {
  return transformableSyncActionsList.includes(syncAction.type);
}

function isReorderSyncAction(
  syncAction: SyncActions
): syncAction is ReorderSyncActions {
  return reorderSyncActionsList.includes(syncAction.type);
}

/**
 * Let pass some actions and transform others:
 * - Updates: UPDATE_ENVIRONMENT, UPDATE_ROUTE, UPDATE_FOLDER, UPDATE_ROUTE_RESPONSE, UPDATE_DATABUCKET, UPDATE_CALLBACK
 * - Reorders: REORDER_ROUTES
 *
 * @param newSyncAction
 * @param recentActionsStore
 * @returns
 */
export function transformSyncAction<T extends SyncActions>(
  newSyncAction: T,
  recentActionsStore: RecentActionsStore
): T | null {
  // process only transformable actions
  if (isTransformableSyncAction(newSyncAction)) {
    const actionKey = buildSyncActionKey(newSyncAction);
    const recentSyncAction = recentActionsStore[
      actionKey
    ] as TransformableSyncActions;

    // if action more recent, always let it pass
    if (
      !recentSyncAction ||
      newSyncAction.timestamp > recentSyncAction.timestamp
    ) {
      return newSyncAction;
    }

    // if action is older, check if it's an UPDATE or a REORDER
    // UDPATE - if it's an update, remove commons properties that were in the previous action, and see if there is still something to apply
    // REORDER - if it's a reorder, do not let it pass

    if (
      !isReorderSyncAction(newSyncAction) &&
      !isReorderSyncAction(recentSyncAction)
    ) {
      // for older "set route response as default" actions (which are regular route response updates), remove the default property only, as other updates may be relevant for the other route response
      if (
        newSyncAction.type === SyncActionTypes.UPDATE_ROUTE_RESPONSE &&
        recentSyncAction.type === SyncActionTypes.UPDATE_ROUTE_RESPONSE &&
        newSyncAction.routeResponseUuid !== recentSyncAction.routeResponseUuid
      ) {
        delete newSyncAction.properties.default;
      } else {
        // if action is older, remove properties that were in the previous action, and see if there is still something to apply
        Object.keys(recentSyncAction.properties).forEach((key) => {
          delete (newSyncAction.properties as any)[key];
        });
      }

      // if everything was removed, do not apply the action
      if (Object.keys(newSyncAction.properties).length === 0) {
        return null;
      }

      return newSyncAction;
    } else {
      return null;
    }
  }

  // let pass other actions
  return newSyncAction;
}

/**
 * Save the last action
 *
 * @param syncAction
 * @param recentActionsStore
 */
export function saveRecentUpdateSyncAction(
  syncAction: SyncActions,
  recentActionsStore: RecentActionsStore
): void {
  if (transformableSyncActionsList.includes(syncAction.type)) {
    recentActionsStore[
      buildSyncActionKey(syncAction as TransformableSyncActions)
    ] = syncAction;
  }
}
