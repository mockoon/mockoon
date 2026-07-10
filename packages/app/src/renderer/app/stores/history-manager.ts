import { Injectable, signal } from '@angular/core';
import {
  Callback,
  DataBucket,
  Environment,
  Folder,
  ReorderableContainers,
  ReorderAction,
  ReorderActionType,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { StoreType } from 'src/renderer/app/models/store.model';
import {
  Actions,
  ActionTypes,
  addCallbackAction,
  addDatabucketAction,
  addFolderAction,
  addRouteAction,
  addRouteResponseAction,
  fullReorderEntitiesAction,
  removeCallbackAction,
  removeDatabucketAction,
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
  updateRouteResponseAction
} from 'src/renderer/app/stores/actions';

type EnvironmentHistoryEntry = {
  undo: Actions;
  redo: Actions;
};

@Injectable({ providedIn: 'root' })
export class HistoryManager {
  private environmentUndoStack = signal<EnvironmentHistoryEntry[]>([]);
  private environmentRedoStack = signal<EnvironmentHistoryEntry[]>([]);

  private readonly environmentHistoryActionTypes = new Set<ActionTypes>([
    ActionTypes.UPDATE_ENVIRONMENT,
    ActionTypes.REORDER_ROUTES,
    ActionTypes.REORDER_DATABUCKETS,
    ActionTypes.REORDER_CALLBACKS,
    ActionTypes.REORDER_ROUTE_RESPONSES,
    ActionTypes.ADD_FOLDER,
    ActionTypes.REMOVE_FOLDER,
    ActionTypes.UPDATE_FOLDER,
    ActionTypes.ADD_ROUTE,
    ActionTypes.REMOVE_ROUTE,
    ActionTypes.UPDATE_ROUTE,
    ActionTypes.ADD_ROUTE_RESPONSE,
    ActionTypes.REMOVE_ROUTE_RESPONSE,
    ActionTypes.UPDATE_ROUTE_RESPONSE,
    ActionTypes.ADD_DATABUCKET,
    ActionTypes.REMOVE_DATABUCKET,
    ActionTypes.UPDATE_DATABUCKET,
    ActionTypes.ADD_CALLBACK,
    ActionTypes.REMOVE_CALLBACK,
    ActionTypes.UPDATE_CALLBACK
  ]);

  public getUndoHistory() {
    return this.environmentUndoStack.asReadonly();
  }

  public getRedoHistory() {
    return this.environmentRedoStack.asReadonly();
  }

  public undoHistory() {
    const history = this.environmentUndoStack();
    const historyEntry = history[history.length - 1];

    if (!historyEntry) {
      return null;
    }

    this.environmentUndoStack.update((stack) => stack.slice(0, -1));
    this.environmentRedoStack.update((stack) => [...stack, historyEntry]);

    return historyEntry;
  }

  public redoHistory() {
    const history = this.environmentRedoStack();
    const historyEntry = history[history.length - 1];

    if (!historyEntry) {
      return null;
    }

    this.environmentUndoStack.update((stack) => [...stack, historyEntry]);
    this.environmentRedoStack.update((stack) => stack.slice(0, -1));

    return historyEntry;
  }

  public addEnvironmentHistoryEntry(previousState: StoreType, action: Actions) {
    if (!this.environmentHistoryActionTypes.has(action.type)) {
      return;
    }

    const historyEntry = this.buildEnvironmentHistoryEntry(
      previousState,
      action
    );

    if (historyEntry) {
      this.environmentUndoStack.update((stack) => [...stack, historyEntry]);

      if (this.environmentUndoStack().length > 100) {
        this.environmentUndoStack.update((stack) => stack.slice(1));
      }
    }
  }

  private buildEnvironmentHistoryEntry(
    previousState: StoreType,
    action: Actions
  ): EnvironmentHistoryEntry | null {
    switch (action.type) {
      case ActionTypes.UPDATE_ENVIRONMENT:
        return this.buildUpdateEnvironmentHistoryEntry(
          previousState,
          action.environmentUuid,
          action.properties,
          action
        );
      case ActionTypes.ADD_ROUTE:
        return {
          undo: removeRouteAction(action.environmentUuid, action.route.uuid),
          redo: action
        };
      case ActionTypes.REMOVE_ROUTE: {
        const removedRoute = previousState.environments
          .find((environment) => environment.uuid === action.environmentUuid)
          ?.routes.find((route) => route.uuid === action.routeUuid);

        if (!removedRoute) {
          return null;
        }

        return {
          undo: this.buildAddRouteActionFromPreviousState(
            previousState,
            action.environmentUuid,
            removedRoute,
            action.routeUuid
          ),
          redo: action
        };
      }
      case ActionTypes.UPDATE_ROUTE:
        return this.buildUpdateItemHistoryEntry(
          previousState,
          action.environmentUuid,
          action.routeUuid,
          action.properties,
          (route, properties) =>
            updateRouteAction(action.environmentUuid, route, properties),
          action
        );
      case ActionTypes.ADD_ROUTE_RESPONSE:
        return {
          undo: removeRouteResponseAction(
            action.environmentUuid,
            action.routeUuid,
            action.routeResponse.uuid
          ),
          redo: action
        };
      case ActionTypes.REMOVE_ROUTE_RESPONSE: {
        const removedRouteResponse = previousState.environments
          .find((environment) => environment.uuid === action.environmentUuid)
          ?.routes.find((route) => route.uuid === action.routeUuid)
          ?.responses.find(
            (routeResponse) => routeResponse.uuid === action.routeResponseUuid
          );

        if (!removedRouteResponse) {
          return null;
        }

        return {
          undo: this.buildAddRouteResponseActionFromPreviousState(
            previousState,
            action.environmentUuid,
            action.routeUuid,
            removedRouteResponse
          ),
          redo: action
        };
      }
      case ActionTypes.UPDATE_ROUTE_RESPONSE:
        return this.buildUpdateItemHistoryEntry(
          previousState,
          action.environmentUuid,
          action.routeResponseUuid,
          action.properties,
          (routeResponse, properties) =>
            updateRouteResponseAction(
              action.environmentUuid,
              action.routeUuid,
              routeResponse,
              properties
            ),
          action
        );
      case ActionTypes.ADD_DATABUCKET:
        return {
          undo: removeDatabucketAction(
            action.environmentUuid,
            action.databucket.uuid
          ),
          redo: action
        };
      case ActionTypes.REMOVE_DATABUCKET: {
        const removedDatabucket = previousState.environments
          .find((environment) => environment.uuid === action.environmentUuid)
          ?.data.find(
            (dataBucket) => dataBucket.uuid === action.databucketUuid
          );

        if (!removedDatabucket) {
          return null;
        }

        return {
          undo: this.buildAddDatabucketActionFromPreviousState(
            previousState,
            action.environmentUuid,
            removedDatabucket
          ),
          redo: action
        };
      }
      case ActionTypes.UPDATE_DATABUCKET:
        return this.buildUpdateItemHistoryEntry(
          previousState,
          action.environmentUuid,
          action.databucketUuid,
          action.properties,
          (databucket, properties) =>
            updateDatabucketAction(
              action.environmentUuid,
              databucket,
              properties
            ),
          action
        );
      case ActionTypes.ADD_CALLBACK:
        return {
          undo: removeCallbackAction(
            action.environmentUuid,
            action.callback.uuid
          ),
          redo: action
        };
      case ActionTypes.REMOVE_CALLBACK: {
        const removedCallback = previousState.environments
          .find((environment) => environment.uuid === action.environmentUuid)
          ?.callbacks.find((callback) => callback.uuid === action.callbackUuid);

        if (!removedCallback) {
          return null;
        }

        return {
          undo: this.buildAddCallbackActionFromPreviousState(
            previousState,
            action.environmentUuid,
            removedCallback
          ),
          redo: action
        };
      }
      case ActionTypes.UPDATE_CALLBACK:
        return this.buildUpdateItemHistoryEntry(
          previousState,
          action.environmentUuid,
          action.callbackUuid,
          action.properties,
          (callback, properties) =>
            updateCallbackAction(action.environmentUuid, callback, properties),
          action
        );
      case ActionTypes.ADD_FOLDER:
        return {
          undo: removeFolderAction(action.environmentUuid, action.folder.uuid),
          redo: action
        };
      case ActionTypes.REMOVE_FOLDER: {
        const removedFolder = previousState.environments
          .find((environment) => environment.uuid === action.environmentUuid)
          ?.folders.find((folder) => folder.uuid === action.folderUuid);

        if (!removedFolder) {
          return null;
        }

        return {
          undo: this.buildAddFolderActionFromPreviousState(
            previousState,
            action.environmentUuid,
            removedFolder,
            action.folderUuid
          ),
          redo: action
        };
      }
      case ActionTypes.UPDATE_FOLDER:
        return this.buildUpdateItemHistoryEntry(
          previousState,
          action.environmentUuid,
          action.folderUuid,
          action.properties,
          (folder, properties) =>
            updateFolderAction(action.environmentUuid, folder, properties),
          action
        );
      case ActionTypes.REORDER_ROUTE_RESPONSES:
        return this.buildReorderHistoryEntry(
          previousState,
          action.environmentUuid,
          action.reorderAction,
          (environment) =>
            environment.routes.find((route) => route.uuid === action.routeUuid)
              ?.responses ?? [],
          (reorderAction) =>
            reorderRouteResponsesAction(
              action.environmentUuid,
              action.routeUuid,
              reorderAction
            )
        );
      case ActionTypes.REORDER_DATABUCKETS:
        return this.buildReorderHistoryEntry(
          previousState,
          action.environmentUuid,
          action.reorderAction,
          (environment) => environment.data,
          (reorderAction) =>
            reorderDatabucketsAction(action.environmentUuid, reorderAction)
        );
      case ActionTypes.REORDER_CALLBACKS:
        return this.buildReorderHistoryEntry(
          previousState,
          action.environmentUuid,
          action.reorderAction,
          (environment) => environment.callbacks,
          (reorderAction) =>
            reorderCallbacksAction(action.environmentUuid, reorderAction)
        );
      case ActionTypes.REORDER_ROUTES:
        return this.buildRouteOrFolderReorderHistoryEntry(
          previousState,
          action.environmentUuid,
          action.reorderAction
        );
      case ActionTypes.FULL_REORDER_ENTITIES:
        return this.buildFullReorderHistoryEntry(previousState, action);
      default:
        return null;
    }
  }

  private buildUpdateEnvironmentHistoryEntry(
    previousState: StoreType,
    environmentUuid: string,
    properties: Partial<Environment>,
    redo: Actions
  ): EnvironmentHistoryEntry | null {
    const previousEnvironment = previousState.environments.find(
      (environment) => environment.uuid === environmentUuid
    );

    if (!previousEnvironment) {
      return null;
    }

    return {
      undo: updateEnvironmentAction(
        environmentUuid,
        this.pickPreviousProperties(previousEnvironment, properties)
      ),
      redo
    };
  }

  private buildUpdateItemHistoryEntry<T extends { uuid: string }>(
    previousState: StoreType,
    environmentUuid: string,
    itemUuid: string,
    properties: Partial<T>,
    actionBuilder: (uuid: string, properties: Partial<T>) => Actions,
    redo: Actions
  ): EnvironmentHistoryEntry | null {
    const environment = previousState.environments.find(
      (entry) => entry.uuid === environmentUuid
    );

    if (!environment) {
      return null;
    }

    const previousItem =
      environment.routes.find((item) => item.uuid === itemUuid) ||
      environment.data.find((item) => item.uuid === itemUuid) ||
      environment.callbacks.find((item) => item.uuid === itemUuid) ||
      environment.folders.find((item) => item.uuid === itemUuid);

    if (!previousItem) {
      return null;
    }

    return {
      undo: actionBuilder(
        itemUuid,
        this.pickPreviousProperties(previousItem as unknown as T, properties)
      ),
      redo
    };
  }

  private buildAddRouteActionFromPreviousState(
    previousState: StoreType,
    environmentUuid: string,
    route: Route,
    routeUuid: string
  ): Actions {
    const { parentId, insertAfterUuid } = this.getRouteOrFolderInsertPosition(
      previousState,
      environmentUuid,
      routeUuid
    );

    return addRouteAction(
      environmentUuid,
      route,
      parentId,
      false,
      insertAfterUuid
    );
  }

  private buildAddFolderActionFromPreviousState(
    previousState: StoreType,
    environmentUuid: string,
    folder: Folder,
    folderUuid: string
  ): Actions {
    const { parentId, insertAfterUuid } = this.getRouteOrFolderInsertPosition(
      previousState,
      environmentUuid,
      folderUuid
    );

    return addFolderAction(
      environmentUuid,
      folder,
      parentId,
      false,
      insertAfterUuid
    );
  }

  private buildAddRouteResponseActionFromPreviousState(
    previousState: StoreType,
    environmentUuid: string,
    routeUuid: string,
    routeResponse: RouteResponse
  ): Actions {
    const insertAfterUuid = this.getInsertAfterUuid(
      this.getRouteResponses(previousState, environmentUuid, routeUuid),
      routeResponse.uuid
    );

    return addRouteResponseAction(
      environmentUuid,
      routeUuid,
      routeResponse,
      false,
      insertAfterUuid
    );
  }

  private buildAddDatabucketActionFromPreviousState(
    previousState: StoreType,
    environmentUuid: string,
    databucket: DataBucket
  ): Actions {
    const insertAfterUuid = this.getInsertAfterUuid(
      this.getDatabuckets(previousState, environmentUuid),
      databucket.uuid
    );

    return addDatabucketAction(
      environmentUuid,
      databucket,
      false,
      insertAfterUuid
    );
  }

  private buildAddCallbackActionFromPreviousState(
    previousState: StoreType,
    environmentUuid: string,
    callback: Callback
  ): Actions {
    const insertAfterUuid = this.getInsertAfterUuid(
      this.getCallbacks(previousState, environmentUuid),
      callback.uuid
    );

    return addCallbackAction(environmentUuid, callback, false, insertAfterUuid);
  }

  private buildReorderHistoryEntry<T extends { uuid: string }>(
    previousState: StoreType,
    environmentUuid: string,
    reorderAction: ReorderAction<string>,
    getItems: (environment: Environment) => T[],
    actionBuilder: (reorderAction: ReorderAction<string>) => Actions
  ): EnvironmentHistoryEntry | null {
    const environment = previousState.environments.find(
      (entry) => entry.uuid === environmentUuid
    );

    if (!environment) {
      return null;
    }

    const previousItems = getItems(environment);
    const sourceIndex = previousItems.findIndex(
      (item) => item.uuid === reorderAction.sourceId
    );

    if (sourceIndex === -1) {
      return null;
    }

    const previousSibling = previousItems[sourceIndex - 1];
    const nextSibling = previousItems[sourceIndex + 1];

    if (!previousSibling && !nextSibling) {
      return null;
    }

    const inverseReorderAction: ReorderAction<string> = previousSibling
      ? {
          sourceId: reorderAction.sourceId,
          sourceParentId: reorderAction.targetParentId,
          targetId: previousSibling.uuid,
          targetParentId: reorderAction.sourceParentId,
          reorderActionType: ReorderActionType.AFTER,
          isSourceContainer: reorderAction.isSourceContainer,
          isTargetContainer: false
        }
      : {
          sourceId: reorderAction.sourceId,
          sourceParentId: reorderAction.targetParentId,
          targetId: nextSibling.uuid,
          targetParentId: reorderAction.sourceParentId,
          reorderActionType: ReorderActionType.BEFORE,
          isSourceContainer: reorderAction.isSourceContainer,
          isTargetContainer: false
        };

    return {
      undo: actionBuilder(inverseReorderAction),
      redo: actionBuilder(reorderAction)
    };
  }

  private buildRouteOrFolderReorderHistoryEntry(
    previousState: StoreType,
    environmentUuid: string,
    reorderAction: ReorderAction<string>
  ): EnvironmentHistoryEntry | null {
    const environment = previousState.environments.find(
      (entry) => entry.uuid === environmentUuid
    );

    if (!environment) {
      return null;
    }

    const previousContainer = this.getRouteOrFolderContainer(
      environment,
      reorderAction.sourceId
    );
    const previousItems = this.getRouteOrFolderChildren(
      environment,
      previousContainer
    );
    const sourceIndex = previousItems.findIndex(
      (item) => item.uuid === reorderAction.sourceId
    );

    if (sourceIndex === -1) {
      return null;
    }

    const previousSibling = previousItems[sourceIndex - 1];
    const nextSibling = previousItems[sourceIndex + 1];

    if (!previousSibling && !nextSibling) {
      return null;
    }

    const inverseReorderAction: ReorderAction<string> = previousSibling
      ? {
          sourceId: reorderAction.sourceId,
          sourceParentId: reorderAction.targetParentId,
          targetId: previousSibling.uuid,
          targetParentId: previousContainer,
          reorderActionType: ReorderActionType.AFTER,
          isSourceContainer: reorderAction.isSourceContainer,
          isTargetContainer: false
        }
      : {
          sourceId: reorderAction.sourceId,
          sourceParentId: reorderAction.targetParentId,
          targetId: nextSibling.uuid,
          targetParentId: previousContainer,
          reorderActionType: ReorderActionType.BEFORE,
          isSourceContainer: reorderAction.isSourceContainer,
          isTargetContainer: false
        };

    return {
      undo: reorderRoutesAction(environmentUuid, inverseReorderAction),
      redo: reorderRoutesAction(environmentUuid, reorderAction)
    };
  }

  private buildFullReorderHistoryEntry(
    previousState: StoreType,
    action: Actions
  ): EnvironmentHistoryEntry | null {
    if (action.type !== ActionTypes.FULL_REORDER_ENTITIES) {
      return null;
    }

    const environment = previousState.environments.find(
      (entry) => entry.uuid === action.environmentUuid
    );

    if (!environment) {
      return null;
    }

    const previousOrder = this.getFullReorderPreviousOrder(environment, action);

    if (!previousOrder) {
      return null;
    }

    return {
      undo: fullReorderEntitiesAction(
        action.environmentUuid,
        action.entity,
        previousOrder,
        action.parentId
      ),
      redo: action
    };
  }

  private pickPreviousProperties<T extends object>(
    previousValue: T,
    properties: Partial<T>
  ): Partial<T> {
    return Object.keys(properties).reduce((accumulator, key) => {
      accumulator[key] = previousValue[key];

      return accumulator;
    }, {} as Partial<T>);
  }

  private getInsertAfterUuid<T extends { uuid: string }>(
    items: T[],
    uuid: string
  ): string | undefined {
    const index = items.findIndex((item) => item.uuid === uuid);

    if (index <= 0) {
      return undefined;
    }

    return items[index - 1].uuid;
  }

  private getRouteOrFolderContainer(
    environment: Environment,
    uuid: string
  ): string | 'root' {
    if (environment.rootChildren.some((child) => child.uuid === uuid)) {
      return 'root';
    }

    const container = environment.folders.find((folder) =>
      folder.children.some((child) => child.uuid === uuid)
    );

    return container?.uuid ?? 'root';
  }

  private getRouteOrFolderChildren(
    environment: Environment,
    containerId: string | 'root'
  ) {
    if (containerId === 'root') {
      return environment.rootChildren;
    }

    return (
      environment.folders.find((folder) => folder.uuid === containerId)
        ?.children ?? []
    );
  }

  private getRouteOrFolderInsertPosition(
    previousState: StoreType,
    environmentUuid: string,
    uuid: string
  ) {
    const environment = previousState.environments.find(
      (entry) => entry.uuid === environmentUuid
    );

    if (!environment) {
      return { parentId: 'root' };
    }

    const parentId = this.getRouteOrFolderContainer(environment, uuid);
    const children = this.getRouteOrFolderChildren(environment, parentId);
    const insertAfterUuid = this.getInsertAfterUuid(children, uuid);

    return {
      parentId,
      insertAfterUuid
    };
  }

  private getRouteResponses(
    state: StoreType,
    environmentUuid: string,
    routeUuid: string
  ): RouteResponse[] {
    return (
      state.environments
        .find((environment) => environment.uuid === environmentUuid)
        ?.routes.find((route) => route.uuid === routeUuid)?.responses ?? []
    );
  }

  private getDatabuckets(
    state: StoreType,
    environmentUuid: string
  ): DataBucket[] {
    return (
      state.environments.find(
        (environment) => environment.uuid === environmentUuid
      )?.data ?? []
    );
  }

  private getCallbacks(state: StoreType, environmentUuid: string): Callback[] {
    return (
      state.environments.find(
        (environment) => environment.uuid === environmentUuid
      )?.callbacks ?? []
    );
  }

  private getFullReorderPreviousOrder(
    environment: Environment,
    action: Actions
  ): string[] | null {
    if (action.type !== ActionTypes.FULL_REORDER_ENTITIES) {
      return null;
    }

    switch (action.entity) {
      case ReorderableContainers.ROUTES: {
        if (action.parentId === 'root') {
          return environment.rootChildren.map((child) => child.uuid);
        }

        const parentFolder = environment.folders.find(
          (folder) => folder.uuid === action.parentId
        );

        return parentFolder?.children.map((child) => child.uuid) ?? null;
      }
      case ReorderableContainers.ROUTE_RESPONSES: {
        const parentRoute = environment.routes.find(
          (route) => route.uuid === action.parentId
        );

        return parentRoute?.responses.map((response) => response.uuid) ?? null;
      }
      case ReorderableContainers.DATABUCKETS:
        return environment.data.map((dataBucket) => dataBucket.uuid);
      case ReorderableContainers.CALLBACKS:
        return environment.callbacks.map((callback) => callback.uuid);
      default:
        return null;
    }
  }
}
