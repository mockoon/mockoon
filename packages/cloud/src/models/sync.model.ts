import {
  Callback,
  DataBucket,
  Environment,
  Folder,
  ReorderAction,
  ReorderableContainers,
  Route,
  RouteResponse
} from '@mockoon/commons';

export interface BaseSyncAction {
  // timestamp of the action, in milliseconds
  timestamp: number;
  // updated server hash
  hash?: string;
}

export type ServerAcknowledgment = {
  hash?: string;
  error?: string;
};

export enum SyncAlerts {
  VERSION_TOO_OLD_WARNING = 'VERSION_TOO_OLD_WARNING'
}

export enum SyncErrors {
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOO_MANY_DEVICES = 'TOO_MANY_DEVICES',
  VERSION_TOO_OLD = 'VERSION_TOO_OLD',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  ENVIRONMENT_TOO_LARGE = 'ENVIRONMENT_TOO_LARGE'
}

export enum SyncDisconnectReasons {
  ROOM_INCOMPATIBLE_VERSION = 'ROOM_INCOMPATIBLE_VERSION'
}

export enum SyncMessageTypes {
  CONNECTED = 'C',
  DISCONNECTED = 'D',
  ENV_LIST = 'EL',
  SYNC = 'S',
  PRESENCE = 'P',
  USER_PRESENCE = 'UP',
  TIME = 'T',
  ALERT = 'A'
}

export type EnvironmentsListPayload = {
  environmentUuid: string;
  hash: string;
}[];

export type ConnectedPayload = {
  migrated: boolean;
};

export type DisconnectedPayload = {
  reason: string;
};

export type SyncUserPresence = {
  uid?: string;
  email?: string;
  displayName?: string;
  environmentUuid?: string;
  cssColor?: string;
};

export type SyncPresence = {
  devices?: number;
  users?: SyncUserPresence[];
};

export enum SyncActionTypes {
  ADD_CLOUD_ENVIRONMENT = 'ADD_CLOUD_ENVIRONMENT',
  REMOVE_CLOUD_ENVIRONMENT = 'REMOVE_CLOUD_ENVIRONMENT',
  REMOVE_ENVIRONMENT = 'REMOVE_ENVIRONMENT',
  // request an environment content from the cloud (up)
  GET_FULL_ENVIRONMENT = 'GET_FULL_ENVIRONMENT',
  UPDATE_FULL_ENVIRONMENT = 'UPDATE_FULL_ENVIRONMENT',
  UPDATE_ENVIRONMENT = 'UPDATE_ENVIRONMENT',
  ADD_ROUTE = 'ADD_ROUTE',
  UPDATE_ROUTE = 'UPDATE_ROUTE',
  REMOVE_ROUTE = 'REMOVE_ROUTE',
  REORDER_ROUTES = 'REORDER_ROUTES',
  ADD_FOLDER = 'ADD_FOLDER',
  UPDATE_FOLDER = 'UPDATE_FOLDER',
  REMOVE_FOLDER = 'REMOVE_FOLDER',
  ADD_ROUTE_RESPONSE = 'ADD_ROUTE_RESPONSE',
  UPDATE_ROUTE_RESPONSE = 'UPDATE_ROUTE_RESPONSE',
  REMOVE_ROUTE_RESPONSE = 'REMOVE_ROUTE_RESPONSE',
  REORDER_ROUTE_RESPONSES = 'REORDER_ROUTE_RESPONSES',
  ADD_DATABUCKET = 'ADD_DATABUCKET',
  UPDATE_DATABUCKET = 'UPDATE_DATABUCKET',
  REMOVE_DATABUCKET = 'REMOVE_DATABUCKET',
  REORDER_DATABUCKETS = 'REORDER_DATABUCKETS',
  ADD_CALLBACK = 'ADD_CALLBACK',
  UPDATE_CALLBACK = 'UPDATE_CALLBACK',
  REMOVE_CALLBACK = 'REMOVE_CALLBACK',
  REORDER_CALLBACKS = 'REORDER_CALLBACKS',
  FULL_REORDER_ENTITIES = 'FULL_REORDER_ENTITIES'
}

export const SyncActionTypesToReorderableContainers = {
  [SyncActionTypes.ADD_ROUTE]: ReorderableContainers.ROUTES,
  [SyncActionTypes.ADD_FOLDER]: ReorderableContainers.ROUTES,
  [SyncActionTypes.REORDER_ROUTES]: ReorderableContainers.ROUTES,
  [SyncActionTypes.ADD_ROUTE_RESPONSE]: ReorderableContainers.ROUTE_RESPONSES,
  [SyncActionTypes.REORDER_ROUTE_RESPONSES]:
    ReorderableContainers.ROUTE_RESPONSES,
  [SyncActionTypes.ADD_DATABUCKET]: ReorderableContainers.DATABUCKETS,
  [SyncActionTypes.REORDER_DATABUCKETS]: ReorderableContainers.DATABUCKETS,
  [SyncActionTypes.ADD_CALLBACK]: ReorderableContainers.CALLBACKS,
  [SyncActionTypes.REORDER_CALLBACKS]: ReorderableContainers.CALLBACKS
};

/**
 * Request an environment content from the cloud
 */
export interface GetFullEnvironmentSyncAction extends BaseSyncAction {
  type: SyncActionTypes.GET_FULL_ENVIRONMENT;
  environmentUuid: string;
  receive: 'UPDATE' | 'CREATE';
}

/**
 * Add a new environment, up or down
 * Also used for full environment sync at connection time
 */
export interface AddCloudEnvironmentSyncAction extends BaseSyncAction {
  type: SyncActionTypes.ADD_CLOUD_ENVIRONMENT;
  environment: Environment;
}

/**
 * Convert an environment to local on the clients, remove it from the cloud on the server
 */
export interface RemoveCloudEnvironmentSyncAction extends BaseSyncAction {
  type: SyncActionTypes.REMOVE_CLOUD_ENVIRONMENT;
  environmentUuid: string;
}

/**
 * Update an environment (partial), up or down
 */
export interface UpdateEnvironmentSyncAction extends BaseSyncAction {
  type: SyncActionTypes.UPDATE_ENVIRONMENT;
  environmentUuid: string;
  properties: Partial<Environment>;
}

/**
 *
 */
export interface UpdateFullEnvironmentSyncAction extends BaseSyncAction {
  type: SyncActionTypes.UPDATE_FULL_ENVIRONMENT;
  environmentUuid: string;
  environment: Environment;
}

/**
 * Add a new route, up or down
 */
export interface AddRouteSyncAction extends BaseSyncAction {
  type: SyncActionTypes.ADD_ROUTE;
  environmentUuid: string;
  route: Route;
  parentId: string | 'root';
}

/**
 * Update a route, up or down
 */
export interface UpdateRouteSyncAction extends BaseSyncAction {
  type: SyncActionTypes.UPDATE_ROUTE;
  environmentUuid: string;
  routeUuid: string;
  properties: Partial<Route>;
}

/**
 * Remove a route, up or down
 */
export interface RemoveRouteSyncAction extends BaseSyncAction {
  type: SyncActionTypes.REMOVE_ROUTE;
  environmentUuid: string;
  routeUuid: string;
}

/**
 * Reorganize routes, up or down
 */
export interface ReorderRoutesSyncAction extends BaseSyncAction {
  type: SyncActionTypes.REORDER_ROUTES;
  environmentUuid: string;
  reorderAction: ReorderAction<string>;
}

/**
 * Add a new folder, up or down
 */
export interface AddFolderSyncAction extends BaseSyncAction {
  type: SyncActionTypes.ADD_FOLDER;
  environmentUuid: string;
  folder: Folder;
  parentId: string | 'root';
}

/**
 * Update a folder, up or down
 */
export interface UpdateFolderSyncAction extends BaseSyncAction {
  type: SyncActionTypes.UPDATE_FOLDER;
  environmentUuid: string;
  folderUuid: string;
  properties: Partial<Folder>;
}

/**
 * Remove a folder, up or down
 */
export interface RemoveFolderSyncAction extends BaseSyncAction {
  type: SyncActionTypes.REMOVE_FOLDER;
  environmentUuid: string;
  folderUuid: string;
}

/**
 * Add a route response, up or down
 */
export interface AddRouteResponseSyncAction extends BaseSyncAction {
  type: SyncActionTypes.ADD_ROUTE_RESPONSE;
  environmentUuid: string;
  routeUuid: string;
  routeResponse: RouteResponse;
  insertAfterUuid?: string;
}

/**
 * Update a route response, up or down
 */
export interface UpdateRouteResponseSyncAction extends BaseSyncAction {
  type: SyncActionTypes.UPDATE_ROUTE_RESPONSE;
  environmentUuid: string;
  routeUuid: string;
  routeResponseUuid: string;
  properties: Partial<RouteResponse>;
}

/**
 * Remove a route response, up or down
 */
export interface RemoveRouteResponseSyncAction extends BaseSyncAction {
  type: SyncActionTypes.REMOVE_ROUTE_RESPONSE;
  environmentUuid: string;
  routeUuid: string;
  routeResponseUuid: string;
}

/**
 * Reorder route responses, up or down
 */
export interface ReorderRouteResponsesSyncAction extends BaseSyncAction {
  type: SyncActionTypes.REORDER_ROUTE_RESPONSES;
  environmentUuid: string;
  routeUuid: string;
  reorderAction: ReorderAction<string>;
}

/**
 * Add a new databucket, up or down
 */
export interface AddDatabucketSyncAction extends BaseSyncAction {
  type: SyncActionTypes.ADD_DATABUCKET;
  environmentUuid: string;
  databucket: DataBucket;
  insertAfterUuid?: string;
}

/**
 * Update a databucket, up or down
 */
export interface UpdateDatabucketSyncAction extends BaseSyncAction {
  type: SyncActionTypes.UPDATE_DATABUCKET;
  environmentUuid: string;
  databucketUuid: string;
  properties: Partial<DataBucket>;
}

/**
 * Remove a databucket, up or down
 */
export interface RemoveDatabucketSyncAction extends BaseSyncAction {
  type: SyncActionTypes.REMOVE_DATABUCKET;
  environmentUuid: string;
  databucketUuid: string;
}

/**
 * Reorder databuckets, up or down
 */
export interface ReorderDatabucketsSyncAction extends BaseSyncAction {
  type: SyncActionTypes.REORDER_DATABUCKETS;
  environmentUuid: string;
  reorderAction: ReorderAction<string>;
}

/**
 * Add a new callback, up or down
 */
export interface AddCallbackSyncAction extends BaseSyncAction {
  type: SyncActionTypes.ADD_CALLBACK;
  environmentUuid: string;
  callback: Callback;
  insertAfterUuid?: string;
}

/**
 * Update a callback, up or down
 */
export interface UpdateCallbackSyncAction extends BaseSyncAction {
  type: SyncActionTypes.UPDATE_CALLBACK;
  environmentUuid: string;
  callbackUuid: string;
  properties: Partial<Callback>;
}

/**
 * Remove a callback, up or down
 */
export interface RemoveCallbackSyncAction extends BaseSyncAction {
  type: SyncActionTypes.REMOVE_CALLBACK;
  environmentUuid: string;
  callbackUuid: string;
}

/**
 * Reorder callbacks, up or down
 */
export interface ReorderCallbacksSyncAction extends BaseSyncAction {
  type: SyncActionTypes.REORDER_CALLBACKS;
  environmentUuid: string;
  reorderAction: ReorderAction<string>;
}

/**
 * Do a full reorder of some entities, down
 */
export interface FullReorderEntitiesSyncAction extends BaseSyncAction {
  type: SyncActionTypes.FULL_REORDER_ENTITIES;
  environmentUuid: string;
  entity: ReorderableContainers;
  order: string[];
  parentId?: string | 'root';
}

export type EnvironmentMutationsSyncActions =
  | UpdateEnvironmentSyncAction
  | UpdateFullEnvironmentSyncAction
  | AddRouteSyncAction
  | UpdateRouteSyncAction
  | RemoveRouteSyncAction
  | ReorderRoutesSyncAction
  | AddFolderSyncAction
  | UpdateFolderSyncAction
  | RemoveFolderSyncAction
  | AddRouteResponseSyncAction
  | UpdateRouteResponseSyncAction
  | RemoveRouteResponseSyncAction
  | ReorderRouteResponsesSyncAction
  | AddDatabucketSyncAction
  | UpdateDatabucketSyncAction
  | RemoveDatabucketSyncAction
  | ReorderDatabucketsSyncAction
  | AddCallbackSyncAction
  | UpdateCallbackSyncAction
  | RemoveCallbackSyncAction
  | ReorderCallbacksSyncAction
  | FullReorderEntitiesSyncAction;

export type UpdatesSyncActions =
  | UpdateEnvironmentSyncAction
  | UpdateRouteSyncAction
  | UpdateFolderSyncAction
  | UpdateRouteResponseSyncAction
  | UpdateDatabucketSyncAction
  | UpdateCallbackSyncAction;

export type ReorderSyncActions = ReorderRoutesSyncAction;

export type TransformableSyncActions = UpdatesSyncActions | ReorderSyncActions;

/**
 * Actions that can be sent TO the cloud
 */
export type UpSyncActions =
  | GetFullEnvironmentSyncAction
  | UpdateFullEnvironmentSyncAction
  | AddCloudEnvironmentSyncAction
  | RemoveCloudEnvironmentSyncAction
  | EnvironmentMutationsSyncActions;

/**
 * Actions that can be sent FROM the cloud
 */
export type DownSyncActions =
  | AddCloudEnvironmentSyncAction
  | UpdateFullEnvironmentSyncAction
  | RemoveCloudEnvironmentSyncAction
  | EnvironmentMutationsSyncActions;

export type SyncActions =
  | GetFullEnvironmentSyncAction
  | UpdateFullEnvironmentSyncAction
  | AddCloudEnvironmentSyncAction
  | RemoveCloudEnvironmentSyncAction
  | EnvironmentMutationsSyncActions;

export type RecentActionsStore = Record<string, SyncActions>;
