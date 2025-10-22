import { Injectable, inject } from '@angular/core';
import {
  DownSyncActions,
  GetFullEnvironmentSyncAction,
  RecentActionsStore,
  SyncActionTypes,
  SyncActions,
  UpdateFullEnvironmentSyncAction,
  saveRecentUpdateSyncAction
} from '@mockoon/cloud';
import { Environment, deterministicStringify } from '@mockoon/commons';
import { from } from 'rxjs';
import { EnvironmentsService } from 'src/renderer/app/services/environments.service';
import { MainApiService } from 'src/renderer/app/services/main-api.service';
import {
  ActionTypes,
  Actions,
  addCallbackAction,
  addDatabucketAction,
  addFolderAction,
  addRouteAction,
  addRouteResponseAction,
  convertEnvironmentToLocalAction,
  fullReorderEntitiesAction,
  reloadEnvironmentAction,
  removeCallbackAction,
  removeDatabucketAction,
  removeEnvironmentAction,
  removeFolderAction,
  removeRouteAction,
  removeRouteResponseAction,
  reorderCallbacksAction,
  reorderDatabucketsAction,
  reorderRouteResponsesAction,
  reorderRoutesAction,
  updateCallbackAction,
  updateDatabucketAction,
  updateEnvironmentAction,
  updateFolderAction,
  updateRouteAction,
  updateRouteResponseAction,
  updateSettingsEnvironmentDescriptorAction
} from 'src/renderer/app/stores/actions';
import { Store } from 'src/renderer/app/stores/store';
import { Config } from 'src/renderer/config';

@Injectable({ providedIn: 'root' })
export class SyncPayloadsService {
  private store = inject(Store);
  private environmentsService = inject(EnvironmentsService);
  private mainApiService = inject(MainApiService);

  private recentActions: RecentActionsStore = {};

  public reducerActionToSyncActionBuilder(
    action: Actions,
    timeDifference: number
  ): SyncActions {
    const timestamp = Date.now() + timeDifference;

    switch (action.type) {
      case ActionTypes.REMOVE_ENVIRONMENT:
      case ActionTypes.CONVERT_ENVIRONMENT_TO_LOCAL:
        return {
          type: SyncActionTypes.REMOVE_CLOUD_ENVIRONMENT,
          timestamp,
          environmentUuid: action.environmentUuid
        };
      case ActionTypes.ADD_ENVIRONMENT:
        return {
          type: SyncActionTypes.ADD_CLOUD_ENVIRONMENT,
          timestamp,
          environment: action.environment
        };
      case ActionTypes.UPDATE_ENVIRONMENT:
        return {
          type: SyncActionTypes.UPDATE_ENVIRONMENT,
          timestamp,
          environmentUuid: action.environmentUuid,
          properties: action.properties
        };
      case ActionTypes.ADD_ROUTE:
        return {
          type: SyncActionTypes.ADD_ROUTE,
          timestamp,
          environmentUuid: action.environmentUuid,
          route: action.route,
          parentId: action.parentId
        };
      case ActionTypes.UPDATE_ROUTE:
        return {
          type: SyncActionTypes.UPDATE_ROUTE,
          timestamp,
          environmentUuid: action.environmentUuid,
          routeUuid: action.routeUuid,
          properties: action.properties
        };
      case ActionTypes.REMOVE_ROUTE:
        return {
          type: SyncActionTypes.REMOVE_ROUTE,
          timestamp,
          environmentUuid: action.environmentUuid,
          routeUuid: action.routeUuid
        };
      case ActionTypes.REORDER_ROUTES:
        return {
          type: SyncActionTypes.REORDER_ROUTES,
          timestamp,
          environmentUuid: action.environmentUuid,
          reorderAction: action.reorderAction
        };
      case ActionTypes.ADD_FOLDER:
        return {
          type: SyncActionTypes.ADD_FOLDER,
          timestamp,
          environmentUuid: action.environmentUuid,
          folder: action.folder,
          parentId: action.parentId
        };
      case ActionTypes.UPDATE_FOLDER:
        return {
          type: SyncActionTypes.UPDATE_FOLDER,
          timestamp,
          environmentUuid: action.environmentUuid,
          folderUuid: action.folderUuid,
          properties: action.properties
        };
      case ActionTypes.REMOVE_FOLDER:
        return {
          type: SyncActionTypes.REMOVE_FOLDER,
          timestamp,
          environmentUuid: action.environmentUuid,
          folderUuid: action.folderUuid
        };

      case ActionTypes.ADD_ROUTE_RESPONSE:
        return {
          type: SyncActionTypes.ADD_ROUTE_RESPONSE,
          timestamp,
          environmentUuid: action.environmentUuid,
          routeUuid: action.routeUuid,
          routeResponse: action.routeResponse,
          insertAfterUuid: action.insertAfterUuid
        };
      case ActionTypes.UPDATE_ROUTE_RESPONSE:
        return {
          type: SyncActionTypes.UPDATE_ROUTE_RESPONSE,
          timestamp,
          environmentUuid: action.environmentUuid,
          routeUuid: action.routeUuid,
          routeResponseUuid: action.routeResponseUuid,
          properties: action.properties
        };
      case ActionTypes.REMOVE_ROUTE_RESPONSE:
        return {
          type: SyncActionTypes.REMOVE_ROUTE_RESPONSE,
          timestamp,
          environmentUuid: action.environmentUuid,
          routeUuid: action.routeUuid,
          routeResponseUuid: action.routeResponseUuid
        };
      case ActionTypes.REORDER_ROUTE_RESPONSES:
        return {
          type: SyncActionTypes.REORDER_ROUTE_RESPONSES,
          timestamp,
          environmentUuid: action.environmentUuid,
          routeUuid: action.routeUuid,
          reorderAction: action.reorderAction
        };
      case ActionTypes.ADD_DATABUCKET:
        return {
          type: SyncActionTypes.ADD_DATABUCKET,
          timestamp,
          environmentUuid: action.environmentUuid,
          databucket: action.databucket,
          insertAfterUuid: action.insertAfterUuid
        };
      case ActionTypes.UPDATE_DATABUCKET:
        return {
          type: SyncActionTypes.UPDATE_DATABUCKET,
          timestamp,
          environmentUuid: action.environmentUuid,
          databucketUuid: action.databucketUuid,
          properties: action.properties
        };
      case ActionTypes.REMOVE_DATABUCKET:
        return {
          type: SyncActionTypes.REMOVE_DATABUCKET,
          timestamp,
          environmentUuid: action.environmentUuid,
          databucketUuid: action.databucketUuid
        };
      case ActionTypes.REORDER_DATABUCKETS:
        return {
          type: SyncActionTypes.REORDER_DATABUCKETS,
          timestamp,
          environmentUuid: action.environmentUuid,
          reorderAction: action.reorderAction
        };
      case ActionTypes.ADD_CALLBACK:
        return {
          type: SyncActionTypes.ADD_CALLBACK,
          timestamp,
          environmentUuid: action.environmentUuid,
          callback: action.callback,
          insertAfterUuid: action.insertAfterUuid
        };
      case ActionTypes.UPDATE_CALLBACK:
        return {
          type: SyncActionTypes.UPDATE_CALLBACK,
          timestamp,
          environmentUuid: action.environmentUuid,
          callbackUuid: action.callbackUuid,
          properties: action.properties
        };
      case ActionTypes.REMOVE_CALLBACK:
        return {
          type: SyncActionTypes.REMOVE_CALLBACK,
          timestamp,
          environmentUuid: action.environmentUuid,
          callbackUuid: action.callbackUuid
        };
      case ActionTypes.REORDER_CALLBACKS:
        return {
          type: SyncActionTypes.REORDER_CALLBACKS,
          timestamp,
          environmentUuid: action.environmentUuid,
          reorderAction: action.reorderAction
        };
      default:
        return null;
    }
  }

  /**
   * Build a sync action to request the full environment from the cloud
   *
   * @param environmentUuid
   * @param timeDifference
   * @returns
   */
  public getFullEnvironmentActionBuilder(
    environmentUuid: string,
    receive: GetFullEnvironmentSyncAction['receive'],
    timeDifference: number
  ): GetFullEnvironmentSyncAction {
    return {
      type: SyncActionTypes.GET_FULL_ENVIRONMENT,
      timestamp: Date.now() + timeDifference,
      environmentUuid,
      receive
    };
  }

  /**
   * Build a sync action to update the full environment in the cloud
   *
   * @param environment
   * @param timeDifference
   * @returns
   */
  public updateFullEnvironmentActionBuilder(
    environment: Environment,
    timeDifference: number
  ): UpdateFullEnvironmentSyncAction {
    return {
      type: SyncActionTypes.UPDATE_FULL_ENVIRONMENT,
      timestamp: Date.now() + timeDifference,
      environmentUuid: environment.uuid,
      environment
    };
  }

  /**
   * Validate if an action can be propagated to the cloud sync
   *
   * @param action
   * @returns
   */
  public canPropagateReducerAction(action: Actions) {
    if (
      action.type === ActionTypes.ADD_ENVIRONMENT &&
      action.cloud &&
      !this.environmentsService.environmentIsCloud(action.environment.uuid)
    ) {
      return true;
    }

    if (
      (action.type === ActionTypes.CONVERT_ENVIRONMENT_TO_LOCAL ||
        action.type === ActionTypes.REMOVE_ENVIRONMENT ||
        action.type === ActionTypes.UPDATE_ENVIRONMENT ||
        action.type === ActionTypes.ADD_ROUTE ||
        action.type === ActionTypes.UPDATE_ROUTE ||
        action.type === ActionTypes.REMOVE_ROUTE ||
        action.type === ActionTypes.REORDER_ROUTES ||
        action.type === ActionTypes.ADD_FOLDER ||
        action.type === ActionTypes.UPDATE_FOLDER ||
        action.type === ActionTypes.REMOVE_FOLDER ||
        action.type === ActionTypes.ADD_ROUTE_RESPONSE ||
        action.type === ActionTypes.UPDATE_ROUTE_RESPONSE ||
        action.type === ActionTypes.REMOVE_ROUTE_RESPONSE ||
        action.type === ActionTypes.REORDER_ROUTE_RESPONSES ||
        action.type === ActionTypes.ADD_DATABUCKET ||
        action.type === ActionTypes.UPDATE_DATABUCKET ||
        action.type === ActionTypes.REMOVE_DATABUCKET ||
        action.type === ActionTypes.REORDER_DATABUCKETS ||
        action.type === ActionTypes.ADD_CALLBACK ||
        action.type === ActionTypes.UPDATE_CALLBACK ||
        action.type === ActionTypes.REMOVE_CALLBACK ||
        action.type === ActionTypes.REORDER_CALLBACKS) &&
      this.environmentsService.environmentIsCloud(action.environmentUuid)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Compute the hash of an object.
   *
   * @param obj
   * @returns
   */
  public computeHash(obj: any) {
    return from(
      this.mainApiService.invoke('APP_GET_HASH', deterministicStringify(obj))
    );
  }

  /**
   * Apply a sync action to the store by dispatching the corresponding reducer action
   *
   * @param syncAction
   * @returns
   */
  public applySyncAction(syncAction: DownSyncActions) {
    if (syncAction.type === SyncActionTypes.ADD_CLOUD_ENVIRONMENT) {
      // if new environment, add it, otherwise replace it
      if (
        this.store
          .get('settings')
          .environments.find(
            (environmentDescriptor) =>
              environmentDescriptor.uuid === syncAction.environment.uuid
          )
      ) {
        this.store.update(
          reloadEnvironmentAction(
            syncAction.environment.uuid,
            syncAction.environment
          )
        );
      } else {
        this.environmentsService
          .addCloudEnvironment(
            syncAction.environment,
            false,
            // do not emit, to avoid triggering a cloud sync again
            {
              force: true,
              emit: false
            }
          )
          .subscribe();
      }

      return;
    }

    let reducerAction: Actions;

    switch (syncAction.type) {
      case SyncActionTypes.REMOVE_CLOUD_ENVIRONMENT:
        // when using the web app, converting to a local environment doesn't make sense
        if (Config.isWeb) {
          reducerAction = removeEnvironmentAction(syncAction.environmentUuid);
          this.mainApiService.invoke(
            'APP_DELETE_ENVIRONMENT_DATA',
            syncAction.environmentUuid
          );
        } else {
          reducerAction = convertEnvironmentToLocalAction(
            syncAction.environmentUuid
          );
        }
        break;
      case SyncActionTypes.UPDATE_ENVIRONMENT:
        reducerAction = updateEnvironmentAction(
          syncAction.environmentUuid,
          syncAction.properties
        );
        break;
      case SyncActionTypes.UPDATE_FULL_ENVIRONMENT:
        reducerAction = reloadEnvironmentAction(
          syncAction.environmentUuid,
          syncAction.environment
        );
        break;
      case SyncActionTypes.ADD_ROUTE:
        reducerAction = addRouteAction(
          syncAction.environmentUuid,
          syncAction.route,
          syncAction.parentId,
          false
        );
        break;
      case SyncActionTypes.UPDATE_ROUTE:
        reducerAction = updateRouteAction(
          syncAction.environmentUuid,
          syncAction.routeUuid,
          syncAction.properties
        );
        break;
      case SyncActionTypes.REMOVE_ROUTE:
        reducerAction = removeRouteAction(
          syncAction.environmentUuid,
          syncAction.routeUuid
        );
        break;
      case SyncActionTypes.REORDER_ROUTES:
        reducerAction = reorderRoutesAction(
          syncAction.environmentUuid,
          syncAction.reorderAction
        );
        break;
      case SyncActionTypes.ADD_FOLDER:
        reducerAction = addFolderAction(
          syncAction.environmentUuid,
          syncAction.folder,
          syncAction.parentId,
          false
        );
        break;
      case SyncActionTypes.UPDATE_FOLDER:
        reducerAction = updateFolderAction(
          syncAction.environmentUuid,
          syncAction.folderUuid,
          syncAction.properties
        );
        break;
      case SyncActionTypes.REMOVE_FOLDER:
        reducerAction = removeFolderAction(
          syncAction.environmentUuid,
          syncAction.folderUuid
        );
        break;
      case SyncActionTypes.ADD_ROUTE_RESPONSE:
        reducerAction = addRouteResponseAction(
          syncAction.environmentUuid,
          syncAction.routeUuid,
          syncAction.routeResponse,
          false,
          syncAction.insertAfterUuid
        );
        break;
      case SyncActionTypes.UPDATE_ROUTE_RESPONSE:
        reducerAction = updateRouteResponseAction(
          syncAction.environmentUuid,
          syncAction.routeUuid,
          syncAction.routeResponseUuid,
          syncAction.properties
        );
        break;
      case SyncActionTypes.REMOVE_ROUTE_RESPONSE:
        reducerAction = removeRouteResponseAction(
          syncAction.environmentUuid,
          syncAction.routeUuid,
          syncAction.routeResponseUuid
        );
        break;
      case SyncActionTypes.REORDER_ROUTE_RESPONSES:
        reducerAction = reorderRouteResponsesAction(
          syncAction.environmentUuid,
          syncAction.routeUuid,
          syncAction.reorderAction
        );
        break;
      case SyncActionTypes.ADD_DATABUCKET:
        reducerAction = addDatabucketAction(
          syncAction.environmentUuid,
          syncAction.databucket,
          false,
          syncAction.insertAfterUuid
        );
        break;
      case SyncActionTypes.UPDATE_DATABUCKET:
        reducerAction = updateDatabucketAction(
          syncAction.environmentUuid,
          syncAction.databucketUuid,
          syncAction.properties
        );
        break;
      case SyncActionTypes.REMOVE_DATABUCKET:
        reducerAction = removeDatabucketAction(
          syncAction.environmentUuid,
          syncAction.databucketUuid
        );
        break;
      case SyncActionTypes.REORDER_DATABUCKETS:
        reducerAction = reorderDatabucketsAction(
          syncAction.environmentUuid,
          syncAction.reorderAction
        );
        break;
      case SyncActionTypes.ADD_CALLBACK:
        reducerAction = addCallbackAction(
          syncAction.environmentUuid,
          syncAction.callback,
          false,
          syncAction.insertAfterUuid
        );
        break;
      case SyncActionTypes.UPDATE_CALLBACK:
        reducerAction = updateCallbackAction(
          syncAction.environmentUuid,
          syncAction.callbackUuid,
          syncAction.properties
        );
        break;
      case SyncActionTypes.REMOVE_CALLBACK:
        reducerAction = removeCallbackAction(
          syncAction.environmentUuid,
          syncAction.callbackUuid
        );
        break;
      case SyncActionTypes.REORDER_CALLBACKS:
        reducerAction = reorderCallbacksAction(
          syncAction.environmentUuid,
          syncAction.reorderAction
        );
        break;
      case SyncActionTypes.FULL_REORDER_ENTITIES:
        reducerAction = fullReorderEntitiesAction(
          syncAction.environmentUuid,
          syncAction.entity,
          syncAction.order,
          syncAction.parentId
        );
        break;
      default:
        break;
    }

    if (reducerAction) {
      this.store.update(reducerAction, true, false);
    }

    if (syncAction.hash) {
      this.store.update(
        updateSettingsEnvironmentDescriptorAction({
          uuid: syncAction.environmentUuid,
          lastServerHash: syncAction.hash
        })
      );
    }
  }

  public saveRecentSyncAction(syncAction: SyncActions) {
    saveRecentUpdateSyncAction(syncAction, this.getRecentActionsStore());
  }

  public getRecentActionsStore() {
    return this.recentActions;
  }
}
