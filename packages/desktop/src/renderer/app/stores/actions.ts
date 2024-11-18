import { DeployInstance, User } from '@mockoon/cloud';
import {
  Callback,
  DataBucket,
  Environment,
  Folder,
  ProcessedDatabucketWithoutValue,
  ReorderAction,
  ReorderableContainers,
  Route,
  RouteResponse
} from '@mockoon/commons';
import {
  CallbackSpecTabNameType,
  CallbackTabsNameType
} from 'src/renderer/app/models/callback.model';
import { DataSubject } from 'src/renderer/app/models/data.model';
import { EnvironmentLog } from 'src/renderer/app/models/environment-logs.model';
import {
  EnvironmentLogsTabsNameType,
  EnvironmentStatus,
  StoreType,
  TabsNameType,
  TemplatesTabsName,
  UIState,
  ViewsNameType
} from 'src/renderer/app/models/store.model';
import { Toast } from 'src/renderer/app/models/toasts.model';
import { ReducerDirectionType } from 'src/renderer/app/stores/reducer';
import {
  EnvironmentDescriptor,
  Settings
} from 'src/shared/models/settings.model';

export const enum ActionTypes {
  CONVERT_ENVIRONMENT_TO_LOCAL = 'CONVERT_ENVIRONMENT_TO_LOCAL',
  UPDATE_USER = 'UPDATE_USER',
  UPDATE_SYNC = 'UPDATE_SYNC',
  UPDATE_DEPLOY_INSTANCES = 'UPDATE_DEPLOY_INSTANCES',
  SET_ACTIVE_TAB = 'SET_ACTIVE_TAB',
  SET_ACTIVE_TAB_IN_CALLBACK = 'SET_ACTIVE_TAB_IN_CALLBACK',
  SET_ACTIVE_VIEW = 'SET_ACTIVE_VIEW',
  SET_ACTIVE_ENVIRONMENT_LOG_TAB = 'SET_ACTIVE_ENVIRONMENT_LOG_TAB',
  SET_ACTIVE_TEMPLATES_TAB = 'SET_ACTIVE_TEMPLATES_TAB',
  SET_ACTIVE_ENVIRONMENT = 'SET_ACTIVE_ENVIRONMENT',
  NAVIGATE_ENVIRONMENTS = 'NAVIGATE_ENVIRONMENTS',
  REORDER_ENVIRONMENTS = 'REORDER_ENVIRONMENTS',
  ADD_ENVIRONMENT = 'ADD_ENVIRONMENT',
  REMOVE_ENVIRONMENT = 'REMOVE_ENVIRONMENT',
  UPDATE_ENVIRONMENT = 'UPDATE_ENVIRONMENT',
  RELOAD_ENVIRONMENT = 'RELOAD_ENVIRONMENT',
  REFRESH_ENVIRONMENT = 'REFRESH_ENVIRONMENT',
  UPDATE_ENVIRONMENT_STATUS = 'UPDATE_ENVIRONMENT_STATUS',
  UPDATE_FILTER = 'UPDATE_FILTER',
  SET_ACTIVE_ROUTE = 'SET_ACTIVE_ROUTE',
  REORDER_ROUTES = 'REORDER_ROUTES',
  REORDER_DATABUCKETS = 'REORDER_DATABUCKETS',
  REORDER_CALLBACKS = 'REORDER_CALLBACKS',
  REORDER_ROUTE_RESPONSES = 'REORDER_ROUTE_RESPONSES',
  ADD_FOLDER = 'ADD_FOLDER',
  REMOVE_FOLDER = 'REMOVE_FOLDER',
  UPDATE_FOLDER = 'UPDATE_FOLDER',
  ADD_ROUTE = 'ADD_ROUTE',
  REMOVE_ROUTE = 'REMOVE_ROUTE',
  REMOVE_ROUTE_RESPONSE = 'REMOVE_ROUTE_RESPONSE',
  UPDATE_ROUTE = 'UPDATE_ROUTE',
  SET_ACTIVE_ROUTE_RESPONSE = 'SET_ACTIVE_ROUTE_RESPONSE',
  ADD_ROUTE_RESPONSE = 'ADD_ROUTE_RESPONSE',
  UPDATE_ROUTE_RESPONSE = 'UPDATE_ROUTE_RESPONSE',
  SET_ACTIVE_DATABUCKET = 'SET_ACTIVE_DATABUCKET',
  SET_ACTIVE_CALLBACK = 'SET_ACTIVE_CALLBACK',
  ADD_DATABUCKET = 'ADD_DATABUCKET',
  REMOVE_DATABUCKET = 'REMOVE_DATABUCKET',
  UPDATE_DATABUCKET = 'UPDATE_DATABUCKET',
  ADD_CALLBACK = 'ADD_CALLBACK',
  REMOVE_CALLBACK = 'REMOVE_CALLBACK',
  UPDATE_CALLBACK = 'UPDATE_CALLBACK',
  LOG_REQUEST = 'LOG_REQUEST',
  CLEAR_LOGS = 'CLEAR_LOGS',
  SET_ACTIVE_ENVIRONMENT_LOG = 'SET_ACTIVE_ENVIRONMENT_LOG',
  ADD_TOAST = 'ADD_TOAST',
  REMOVE_TOAST = 'REMOVE_TOAST',
  SET_USER_ID = 'SET_USER_ID',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  UPDATE_SETTINGS_ENVIRONMENT_DESCRIPTOR = 'UPDATE_SETTINGS_ENVIRONMENT_DESCRIPTOR',
  UPDATE_UI_STATE = 'UPDATE_UI_STATE',
  START_ENTITY_DUPLICATION_TO_ANOTHER_ENVIRONMENT = 'START_ENTITY_DUPLICATION_TO_ANOTHER_ENVIRONMENT',
  CANCEL_ENTITY_DUPLICATION_TO_ANOTHER_ENVIRONMENT = 'CANCEL_ENTITY_DUPLICATION_TO_ANOTHER_ENVIRONMENT',
  DUPLICATE_ROUTE_TO_ANOTHER_ENVIRONMENT = 'DUPLICATE_ROUTE_TO_ANOTHER_ENVIRONMENT',
  DUPLICATE_DATABUCKET_TO_ANOTHER_ENVIRONMENT = 'DUPLICATE_DATABUCKET_TO_ANOTHER_ENVIRONMENT',
  DUPLICATE_CALLBACK_TO_ANOTHER_ENVIRONMENT = 'DUPLICATE_CALLBACK_TO_ANOTHER_ENVIRONMENT',
  FULL_REORDER_ENTITIES = 'FULL_REORDER_ENTITIES',
  UPDATE_PROCESSED_DATABUCKETS = 'UPDATE_PROCESSED_DATABUCKETS'
}

/**
 * When emitter, remove an environment from the cloud
 * When receiver, convert an environment to local
 *
 * @param environmentUuid - environment UUID to remove
 */
export const convertEnvironmentToLocalAction = (environmentUuid: string) =>
  ({
    type: ActionTypes.CONVERT_ENVIRONMENT_TO_LOCAL,
    environmentUuid
  }) as const;

/**
 * Update the user information
 *
 * @param properties - user properties to update
 */
export const updateUserAction = (properties: Partial<User>) =>
  ({
    type: ActionTypes.UPDATE_USER,
    properties
  }) as const;

/**
 * Update the cloud sync information
 *
 * @param properties - cloud sync status properties to update
 */
export const updateSyncAction = (properties: Partial<StoreType['sync']>) =>
  ({
    type: ActionTypes.UPDATE_SYNC,
    properties
  }) as const;

/**
 * Update the cloud sync information
 *
 * @param properties - cloud sync status properties to update
 */
export const updateDeployInstancesAction = (instances: DeployInstance[]) =>
  ({
    type: ActionTypes.UPDATE_DEPLOY_INSTANCES,
    instances
  }) as const;

/**
 * Change the active route tab
 *
 * @param activeTab - id of the tab to set as active
 */
export const setActiveTabAction = (activeTab: TabsNameType) =>
  ({
    type: ActionTypes.SET_ACTIVE_TAB,
    activeTab
  }) as const;

/**
 * Change the active tab in callback view.
 *
 * @param activeTab - id of the tab to set as active
 */
export const setActiveTabInCallbackViewAction = (
  activeTab: CallbackTabsNameType,
  activeSpecTab?: CallbackSpecTabNameType
) =>
  ({
    type: ActionTypes.SET_ACTIVE_TAB_IN_CALLBACK,
    activeTab,
    activeSpecTab
  }) as const;

/**
 * Change the active main view
 *
 * @param activeView - id of the view to set as active
 */
export const setActiveViewAction = (activeView: ViewsNameType) =>
  ({
    type: ActionTypes.SET_ACTIVE_VIEW,
    activeView
  }) as const;

/**
 * Change the active environment logs tab
 *
 * @param activeTab - id of the tab to set as active
 */
export const setActiveEnvironmentLogTabAction = (
  activeTab: EnvironmentLogsTabsNameType
) =>
  ({
    type: ActionTypes.SET_ACTIVE_ENVIRONMENT_LOG_TAB,
    activeTab
  }) as const;

/**
 * Change the active templates tab
 *
 * @param activeTab - id of the tab to set as active
 */
export const setActiveTemplatesTabAction = (activeTab: TemplatesTabsName) =>
  ({
    type: ActionTypes.SET_ACTIVE_TEMPLATES_TAB,
    activeTab
  }) as const;

/**
 * Set the active environment (currently displayed)
 *
 * @param environmentUUID - UUID of the environment to switch to
 */
export const setActiveEnvironmentAction = (environmentUUID: string) =>
  ({
    type: ActionTypes.SET_ACTIVE_ENVIRONMENT,
    environmentUUID
  }) as const;

/**
 * Navigate between environments
 *
 * @param direction - direction to which navigate to
 */
export const navigateEnvironmentsAction = (direction: ReducerDirectionType) =>
  ({
    type: ActionTypes.NAVIGATE_ENVIRONMENTS,
    direction
  }) as const;

/**
 * Reorder environments
 *
 * @param reorderAction
 * @returns
 */
export const reorderEnvironmentsAction = (
  reorderAction: ReorderAction<string>
) =>
  ({
    type: ActionTypes.REORDER_ENVIRONMENTS,
    reorderAction
  }) as const;

/**
 *
 * Reorder routes and folders
 *
 * @param environmentUuid - environment UUID to which the routes belong to
 * @param reorderAction
 * @returns
 */
export const reorderRoutesAction = (
  environmentUuid: string,
  reorderAction: ReorderAction<string>
) =>
  ({
    type: ActionTypes.REORDER_ROUTES,
    reorderAction,
    environmentUuid
  }) as const;

/**
 * Reorder route responses
 *
 * @param environmentUuid - environment UUID to which the route belongs to
 * @param routeUuid - route UUID to which the route response belong to
 * @param reorderAction
 */
export const reorderRouteResponsesAction = (
  environmentUuid: string,
  routeUuid: string,
  reorderAction: ReorderAction<string>
) =>
  ({
    type: ActionTypes.REORDER_ROUTE_RESPONSES,
    environmentUuid,
    routeUuid,
    reorderAction
  }) as const;

/**
 * Reorder databuckets
 *
 * @param environmentUuid - environment UUID to which the databuckets belong to
 * @param reorderAction
 */
export const reorderDatabucketsAction = (
  environmentUuid: string,
  reorderAction: ReorderAction<string>
) =>
  ({
    type: ActionTypes.REORDER_DATABUCKETS,
    environmentUuid,
    reorderAction
  }) as const;

/**
 * Full reorder of entities
 *
 * @param environmentUuid - environment UUID to which the entities belong to
 * @param entity - entity to reorder
 * @param order - new order of the entities (uuids)
 * @param parentId - route UUID to which the route response belong to, if entity is route response, or 'root'/uuid of the parent folder if entity is a folder/route
 */
export const fullReorderEntitiesAction = (
  environmentUuid: string,
  entity: ReorderableContainers,
  order: string[],
  parentId?: string | 'root'
) =>
  ({
    type: ActionTypes.FULL_REORDER_ENTITIES,
    environmentUuid,
    entity,
    order,
    parentId
  }) as const;

/**
 * Reorder callbacks
 *
 * @param environmentUuid - environment UUID to which the databuckets belong to
 * @param reorderAction
 * @returns
 */
export const reorderCallbacksAction = (
  environmentUuid: string,
  reorderAction: ReorderAction<string>
) =>
  ({
    type: ActionTypes.REORDER_CALLBACKS,
    environmentUuid,
    reorderAction
  }) as const;

/**
 * Add a new environment
 *
 * @param environment - environment to add
 * @param options.filePath - update the filepath
 * @param options.insertIndex - insert at index, default to end of list
 * @param options.setActive - if provided, set the new environment as active
 * @param options.cloud - indicates if the environment is added to the cloud
 * @param options.hash - hash of the environment file, if cloud is true
 */
export const addEnvironmentAction = (
  environment: Environment,
  options?: {
    filePath?: string;
    insertAfterIndex?: number;
    setActive?: boolean;
    cloud?: boolean;
    hash?: string;
  }
) =>
  ({
    type: ActionTypes.ADD_ENVIRONMENT,
    environment,
    ...options
  }) as const;

/**
 * Remove an environment
 *
 * @param environmentUUID - environment UUID to remove
 */
export const removeEnvironmentAction = (environmentUUID: string) =>
  ({
    type: ActionTypes.REMOVE_ENVIRONMENT,
    environmentUUID
  }) as const;

/**
 * Update an environment
 *
 * @param environmentUuid - environment UUID to update
 * @param properties - properties to update
 */
export const updateEnvironmentAction = (
  environmentUuid: string,
  properties: Partial<Environment>
) =>
  ({
    type: ActionTypes.UPDATE_ENVIRONMENT,
    environmentUuid,
    properties
  }) as const;

/**
 * Reload an environment
 *
 * @param previousUUID - previous environment UUID
 * @param newEnvironment - new environment
 */
export const reloadEnvironmentAction = (
  previousUUID: string,
  newEnvironment: Environment
) =>
  ({
    type: ActionTypes.RELOAD_ENVIRONMENT,
    previousUUID,
    newEnvironment
  }) as const;

/**
 * Trigger a save of an environment without modyfing its state
 *
 * @param environmentUUID
 */
export const refreshEnvironmentAction = (environmentUUID: string) =>
  ({
    type: ActionTypes.REFRESH_ENVIRONMENT,
    environmentUUID
  }) as const;

/**
 * Update an environment status
 *
 * @param properties - properties to update
 */
export const updateEnvironmentStatusAction = (
  properties: Partial<EnvironmentStatus>,
  environmentUUID: string
) =>
  ({
    type: ActionTypes.UPDATE_ENVIRONMENT_STATUS,
    properties,
    environmentUUID
  }) as const;

/**
 * Update a filter
 *
 * @param filterValue
 */
export const updateFilterAction = (
  filter: keyof StoreType['filters'],
  filterValue: string
) =>
  ({
    type: ActionTypes.UPDATE_FILTER,
    filter,
    filterValue
  }) as const;

/**
 * Set the active route (currently displayed)
 *
 * @param routeUUID - route UUID to set as active
 */
export const setActiveRouteAction = (routeUUID: string) =>
  ({
    type: ActionTypes.SET_ACTIVE_ROUTE,
    routeUUID
  }) as const;

/**
 * Add a folder
 *
 * @param environmentUuid - environment UUID to which the folder is linked to
 * @param folder - folder to add
 * @param parentId - target parent (root or folder) Id
 * @param uiReset - indicates if the filters must be reset after addition
 */
export const addFolderAction = (
  environmentUuid: string,
  folder: Folder,
  parentId: string | 'root',
  uiReset: boolean
) =>
  ({
    type: ActionTypes.ADD_FOLDER,
    environmentUuid,
    folder,
    parentId,
    uiReset
  }) as const;

/**
 * Remove a folder
 *
 * @param environmentUuid - environment UUID to which the folder is linked to
 * @param folderUuid - folder UUID to remove
 */
export const removeFolderAction = (
  environmentUuid: string,
  folderUuid: string
) =>
  ({
    type: ActionTypes.REMOVE_FOLDER,
    environmentUuid,
    folderUuid
  }) as const;

/**
 * Update a folder
 *
 * @param environmentUuid - environment UUID to which the folder is linked to
 * @param folderUuid - UUID of the folder to update
 * @param properties - properties to update
 */
export const updateFolderAction = (
  environmentUuid: string,
  folderUuid: string,
  properties: Partial<Folder>
) =>
  ({
    type: ActionTypes.UPDATE_FOLDER,
    environmentUuid,
    folderUuid,
    properties
  }) as const;

/**
 * Add a route
 *
 * @param environmentUuid - environment UUID to which the route is linked to
 * @param route - route to add
 * @param parentId - target parent (root or folder) Id
 * @param uiReset - indicates if the route must be focused after addition and the UI reset (switch tabs)
 */
export const addRouteAction = (
  environmentUuid: string,
  route: Route,
  parentId: string | 'root',
  uiReset: boolean
) =>
  ({
    type: ActionTypes.ADD_ROUTE,
    route,
    parentId,
    uiReset,
    environmentUuid
  }) as const;

/**
 * Remove a route
 *
 * @param environmentUuid - environment UUID to which the route is linked to
 * @param routeUuid - route UUID to remove
 */
export const removeRouteAction = (environmentUuid: string, routeUuid: string) =>
  ({
    type: ActionTypes.REMOVE_ROUTE,
    routeUuid,
    environmentUuid
  }) as const;

/**
 * Remove a route response
 *
 * @param environmentUuid - environment UUID to which the route response is linked to
 * @param routeUuid - route UUID to which the route response is linked to
 * @param routeResponseUuid - route response UUID to update
 */
export const removeRouteResponseAction = (
  environmentUuid: string,
  routeUuid: string,
  routeResponseUuid: string
) =>
  ({
    type: ActionTypes.REMOVE_ROUTE_RESPONSE,
    environmentUuid,
    routeUuid,
    routeResponseUuid
  }) as const;

/**
 * Update a route
 *
 * @param environmentUuid - environment UUID to which the route is linked to
 * @param routeUuid - route UUID to update
 * @param properties - properties to update
 */
export const updateRouteAction = (
  environmentUuid: string,
  routeUuid: string,
  properties: Partial<Route>
) =>
  ({
    type: ActionTypes.UPDATE_ROUTE,
    environmentUuid,
    routeUuid,
    properties
  }) as const;

/**
 * Set the active route response (currently displayed)
 *
 * @param routeResponseUUID - route response UUID to set as active
 */
export const setActiveRouteResponseAction = (routeResponseUUID: string) =>
  ({
    type: ActionTypes.SET_ACTIVE_ROUTE_RESPONSE,
    routeResponseUUID
  }) as const;

/**
 * Add a new route response
 *
 * @param environmentUuid - environment UUID to which the route response is linked to
 * @param routeUuid - route UUID to which the route response is linked to
 * @param routeResponse - route response to add
 * @param uiReset - indicates if the route response must be focused after addition
 * @param insertAfterUuid - route response UUID after which the new route response must be inserted
 */
export const addRouteResponseAction = (
  environmentUuid: string,
  routeUuid: string,
  routeResponse: RouteResponse,
  uiReset: boolean,
  insertAfterUuid?: string
) =>
  ({
    type: ActionTypes.ADD_ROUTE_RESPONSE,
    environmentUuid,
    routeUuid,
    routeResponse,
    uiReset,
    insertAfterUuid
  }) as const;

/**
 * Finalizes route movement to another environment
 */
export const duplicateRouteToAnotherEnvironmentAction = (
  route: Route,
  targetEnvironmentUUID: string
) =>
  ({
    type: ActionTypes.DUPLICATE_ROUTE_TO_ANOTHER_ENVIRONMENT,
    route,
    targetEnvironmentUUID
  }) as const;

/**
 * Triggers movement of an entity to another environment
 */
export const startEntityDuplicationToAnotherEnvironmentAction = (
  subjectUUID: string,
  subject: DataSubject
) =>
  ({
    type: ActionTypes.START_ENTITY_DUPLICATION_TO_ANOTHER_ENVIRONMENT,
    subjectUUID,
    subject
  }) as const;

/**
 * Cancels out entity movement
 */
export const cancelEntityDuplicationToAnotherEnvironmentAction = () =>
  ({
    type: ActionTypes.CANCEL_ENTITY_DUPLICATION_TO_ANOTHER_ENVIRONMENT
  }) as const;

/**
 * Finalizes databucket movement to another environment
 */
export const duplicateDatabucketToAnotherEnvironmentAction = (
  databucket: DataBucket,
  targetEnvironmentUUID: string
) =>
  ({
    type: ActionTypes.DUPLICATE_DATABUCKET_TO_ANOTHER_ENVIRONMENT,
    databucket,
    targetEnvironmentUUID
  }) as const;

/**
 * Finalizes databucket movement to another environment
 */
export const duplicateCallbackToAnotherEnvironmentAction = (
  callback: Callback,
  targetEnvironmentUUID: string
) =>
  ({
    type: ActionTypes.DUPLICATE_CALLBACK_TO_ANOTHER_ENVIRONMENT,
    callback,
    targetEnvironmentUUID
  }) as const;

/**
 * Update a route response
 *
 * @param environmentUuid - environment UUID to which the route response is linked to
 * @param routeUuid - route UUID to which the route response is linked to
 * @param routeResponseUuid - route response UUID to update
 * @param properties - properties to update
 */
export const updateRouteResponseAction = (
  environmentUuid: string,
  routeUuid: string,
  routeResponseUuid: string,
  properties: Partial<RouteResponse>
) =>
  ({
    type: ActionTypes.UPDATE_ROUTE_RESPONSE,
    environmentUuid,
    routeUuid,
    routeResponseUuid,
    properties
  }) as const;

/**
 * Set the active databucket (currently displayed)
 *
 * @param databucketUUID - databucket UUID to set as active
 */
export const setActiveDatabucketAction = (databucketUUID: string) =>
  ({
    type: ActionTypes.SET_ACTIVE_DATABUCKET,
    databucketUUID
  }) as const;

/**
 * Set the active callback (currently displayed)
 *
 * @param callbackUUID - callback UUID to set as active
 */
export const setActiveCallbackAction = (callbackUUID: string) =>
  ({
    type: ActionTypes.SET_ACTIVE_CALLBACK,
    callbackUUID
  }) as const;

/**
 * Add a databucket
 *
 * @param environmentUuid - environment UUID to which the databucket is linked to
 * @param databucket - databucket to add
 * @param insertAfterUuid - databucket UUID after which the new databucket must be inserted
 * @param uiReset - indicates if the databucket must be selected after addition
 */
export const addDatabucketAction = (
  environmentUuid: string,
  databucket: DataBucket,
  uiReset: boolean,
  insertAfterUuid?: string
) =>
  ({
    type: ActionTypes.ADD_DATABUCKET,
    environmentUuid,
    databucket,
    uiReset,
    insertAfterUuid
  }) as const;

/**
 *
 * @param environmentUuid - environment UUID to which the callback is linked to
 * @param callback - callback to add
 * @param uiReset - indicates if the callback must be selected after addition, filters reset
 * @param insertAfterUuid - callback UUID after which the new callback must be inserted
 * @returns
 */
export const addCallbackAction = (
  environmentUuid: string,
  callback: Callback,
  uiReset: boolean,
  insertAfterUuid?: string
) =>
  ({
    type: ActionTypes.ADD_CALLBACK,
    environmentUuid,
    callback,
    uiReset,
    insertAfterUuid
  }) as const;

/**
 * Remove a databucket
 *
 * @param environmentUuid - environment UUID to which the databucket is linked to
 * @param databucketUuid - databucket UUID to remove
 */
export const removeDatabucketAction = (
  environmentUuid: string,
  databucketUuid: string
) =>
  ({
    type: ActionTypes.REMOVE_DATABUCKET,
    environmentUuid,
    databucketUuid
  }) as const;

/**
 * Remove a callback
 * @param environmentUuid - environment UUID to which the callback is linked to
 * @param callbackUuid - callback UUID to remove
 * @returns
 */
export const removeCallbackAction = (
  environmentUuid: string,
  callbackUuid: string
) =>
  ({
    type: ActionTypes.REMOVE_CALLBACK,
    environmentUuid,
    callbackUuid
  }) as const;

/**
 * Update a databucket
 *
 * @param environmentUuid - environment UUID to which the databucket is linked to
 * @param databucketUuid - databucket UUID to update
 * @param properties - properties to update
 */
export const updateDatabucketAction = (
  environmentUuid: string,
  databucketUuid: string,
  properties: Partial<DataBucket>
) =>
  ({
    type: ActionTypes.UPDATE_DATABUCKET,
    environmentUuid,
    databucketUuid,
    properties
  }) as const;

/**
 * Update a callback
 *
 * @param environmentUuid - environment UUID to which the callback is linked to
 * @param callbackUuid - callback UUID to update
 * @param properties - properties to update
 */
export const updateCallbackAction = (
  environmentUuid: string,
  callbackUuid: string,
  properties: Partial<Callback>
) =>
  ({
    type: ActionTypes.UPDATE_CALLBACK,
    environmentUuid,
    callbackUuid,
    properties
  }) as const;

/**
 * Log the request (request and response)
 *
 * @param environmentUUID - environment UUID to which the request is linked to
 *
 * @param logItem - environment log object
 */
export const logRequestAction = (
  environmentUUID: string,
  logItem: EnvironmentLog
) =>
  ({
    type: ActionTypes.LOG_REQUEST,
    environmentUUID,
    logItem
  }) as const;

/**
 * Clear an environment logs
 *
 * @param environmentUUID - environment UUID from which logs must be cleared
 */
export const clearLogsAction = (environmentUUID: string) =>
  ({
    type: ActionTypes.CLEAR_LOGS,
    environmentUUID
  }) as const;

/**
 * Set the active environment log UUID for a given environment
 *
 * @param environmentUUID - logs environment UUID
 * @param activeEnvironmentLogUUID - environment log UUID to set as active
 */
export const setActiveEnvironmentLogUUIDAction = (
  environmentUUID: string,
  activeEnvironmentLogUUID: string
) =>
  ({
    type: ActionTypes.SET_ACTIVE_ENVIRONMENT_LOG,
    environmentUUID,
    activeEnvironmentLogUUID
  }) as const;

/**
 * Add a toast
 *
 * @param toast - toast to add
 */
export const addToastAction = (toast: Toast) =>
  ({
    type: ActionTypes.ADD_TOAST,
    toast
  }) as const;

/**
 * Remove a toast
 *
 * @param toastUUID - toast UUID to remove
 */
export const removeToastAction = (toastUUID: string) =>
  ({
    type: ActionTypes.REMOVE_TOAST,
    toastUUID
  }) as const;

/**
 * Update user settings
 *
 * @param properties - properties to update
 */
export const updateSettingsAction = (properties: Partial<Settings>) =>
  ({
    type: ActionTypes.UPDATE_SETTINGS,
    properties
  }) as const;

/**
 * Update settings environment descriptor
 *
 * @param properties - properties to update (uuid and partial descriptor)
 */
export const updateSettingsEnvironmentDescriptorAction = (
  descriptor: Partial<EnvironmentDescriptor> &
    Pick<EnvironmentDescriptor, 'uuid'>
) =>
  ({
    type: ActionTypes.UPDATE_SETTINGS_ENVIRONMENT_DESCRIPTOR,
    descriptor
  }) as const;

/**
 * Update UI state
 *
 * @param properties - properties to update
 */
export const updateUIStateAction = (properties: Partial<UIState>) =>
  ({
    type: ActionTypes.UPDATE_UI_STATE,
    properties
  }) as const;

/**
 * Update processed databuckets
 *
 * @param environmentUuid - environment UUID to which the processed databuckets belong to
 * @param processedDatabuckets - processed databuckets to update
 */
export const updateProcessedDatabucketsAction = (
  environmentUuid: string,
  processedDatabuckets: ProcessedDatabucketWithoutValue[]
) =>
  ({
    type: ActionTypes.UPDATE_PROCESSED_DATABUCKETS,
    environmentUuid,
    processedDatabuckets
  }) as const;

export type Actions =
  | ReturnType<typeof convertEnvironmentToLocalAction>
  | ReturnType<typeof updateUserAction>
  | ReturnType<typeof updateSyncAction>
  | ReturnType<typeof updateDeployInstancesAction>
  | ReturnType<typeof setActiveTabAction>
  | ReturnType<typeof setActiveTabInCallbackViewAction>
  | ReturnType<typeof setActiveViewAction>
  | ReturnType<typeof setActiveEnvironmentLogTabAction>
  | ReturnType<typeof setActiveTemplatesTabAction>
  | ReturnType<typeof setActiveEnvironmentAction>
  | ReturnType<typeof navigateEnvironmentsAction>
  | ReturnType<typeof reorderEnvironmentsAction>
  | ReturnType<typeof reorderRoutesAction>
  | ReturnType<typeof reorderRouteResponsesAction>
  | ReturnType<typeof reorderDatabucketsAction>
  | ReturnType<typeof fullReorderEntitiesAction>
  | ReturnType<typeof reorderCallbacksAction>
  | ReturnType<typeof addEnvironmentAction>
  | ReturnType<typeof removeEnvironmentAction>
  | ReturnType<typeof updateEnvironmentAction>
  | ReturnType<typeof reloadEnvironmentAction>
  | ReturnType<typeof refreshEnvironmentAction>
  | ReturnType<typeof updateEnvironmentStatusAction>
  | ReturnType<typeof updateFilterAction>
  | ReturnType<typeof setActiveRouteAction>
  | ReturnType<typeof addFolderAction>
  | ReturnType<typeof removeFolderAction>
  | ReturnType<typeof updateFolderAction>
  | ReturnType<typeof addRouteAction>
  | ReturnType<typeof removeRouteAction>
  | ReturnType<typeof removeRouteResponseAction>
  | ReturnType<typeof updateRouteAction>
  | ReturnType<typeof setActiveRouteResponseAction>
  | ReturnType<typeof addRouteResponseAction>
  | ReturnType<typeof updateRouteResponseAction>
  | ReturnType<typeof setActiveDatabucketAction>
  | ReturnType<typeof setActiveCallbackAction>
  | ReturnType<typeof addDatabucketAction>
  | ReturnType<typeof removeDatabucketAction>
  | ReturnType<typeof updateDatabucketAction>
  | ReturnType<typeof addCallbackAction>
  | ReturnType<typeof removeCallbackAction>
  | ReturnType<typeof updateCallbackAction>
  | ReturnType<typeof logRequestAction>
  | ReturnType<typeof clearLogsAction>
  | ReturnType<typeof setActiveEnvironmentLogUUIDAction>
  | ReturnType<typeof addToastAction>
  | ReturnType<typeof removeToastAction>
  | ReturnType<typeof updateUIStateAction>
  | ReturnType<typeof updateSettingsAction>
  | ReturnType<typeof updateSettingsEnvironmentDescriptorAction>
  | ReturnType<typeof startEntityDuplicationToAnotherEnvironmentAction>
  | ReturnType<typeof cancelEntityDuplicationToAnotherEnvironmentAction>
  | ReturnType<typeof duplicateRouteToAnotherEnvironmentAction>
  | ReturnType<typeof duplicateDatabucketToAnotherEnvironmentAction>
  | ReturnType<typeof duplicateCallbackToAnotherEnvironmentAction>
  | ReturnType<typeof updateProcessedDatabucketsAction>;
