import {
  DataBucket,
  Environment,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { DatabucketProperties } from 'src/renderer/app/models/databucket.model';
import { EnvironmentLog } from 'src/renderer/app/models/environment-logs.model';
import { EnvironmentProperties } from 'src/renderer/app/models/environment.model';
import {
  RouteProperties,
  RouteResponseProperties
} from 'src/renderer/app/models/route.model';
import { SettingsProperties } from 'src/renderer/app/models/settings.model';
import {
  EnvironmentLogsTabsNameType,
  EnvironmentStatusProperties,
  TabsNameType,
  UIStateProperties,
  ViewsNameType
} from 'src/renderer/app/models/store.model';
import { Toast } from 'src/renderer/app/models/toasts.model';
import {
  ReducerDirectionType,
  ReducerIndexes
} from 'src/renderer/app/stores/reducer';

export const enum ActionTypes {
  SET_ACTIVE_TAB = 'SET_ACTIVE_TAB',
  SET_ACTIVE_VIEW = 'SET_ACTIVE_VIEW',
  SET_ACTIVE_ENVIRONMENT_LOG_TAB = 'SET_ACTIVE_ENVIRONMENT_LOG_TAB',
  SET_ACTIVE_ENVIRONMENT = 'SET_ACTIVE_ENVIRONMENT',
  NAVIGATE_ENVIRONMENTS = 'NAVIGATE_ENVIRONMENTS',
  MOVE_ENVIRONMENTS = 'MOVE_ENVIRONMENTS',
  ADD_ENVIRONMENT = 'ADD_ENVIRONMENT',
  REMOVE_ENVIRONMENT = 'REMOVE_ENVIRONMENT',
  UPDATE_ENVIRONMENT = 'UPDATE_ENVIRONMENT',
  RELOAD_ENVIRONMENT = 'RELOAD_ENVIRONMENT',
  UPDATE_ENVIRONMENT_STATUS = 'UPDATE_ENVIRONMENT_STATUS',
  UPDATE_ENVIRONMENT_ROUTE_FILTER = 'UPDATE_ENVIRONMENT_ROUTE_FILTER',
  UPDATE_ENVIRONMENT_DATABUCKET_FILTER = 'UPDATE_ENVIRONMENT_DATABUCKET_FILTER',
  SET_ACTIVE_ROUTE = 'SET_ACTIVE_ROUTE',
  NAVIGATE_ROUTES = 'NAVIGATE_ROUTES',
  MOVE_ROUTES = 'MOVE_ROUTES',
  MOVE_DATABUCKETS = 'MOVE_DATABUCKETS',
  MOVE_ROUTE_RESPONSES = 'MOVE_ROUTE_RESPONSES',
  ADD_ROUTE = 'ADD_ROUTE',
  REMOVE_ROUTE = 'REMOVE_ROUTE',
  REMOVE_ROUTE_RESPONSE = 'REMOVE_ROUTE_RESPONSE',
  UPDATE_ROUTE = 'UPDATE_ROUTE',
  SET_ACTIVE_ROUTE_RESPONSE = 'SET_ACTIVE_ROUTE_RESPONSE',
  ADD_ROUTE_RESPONSE = 'ADD_ROUTE_RESPONSE',
  UPDATE_ROUTE_RESPONSE = 'UPDATE_ROUTE_RESPONSE',
  SET_DEFAULT_ROUTE_RESPONSE = 'SET_DEFAULT_ROUTE_RESPONSE',
  SET_ACTIVE_DATABUCKET = 'SET_ACTIVE_DATABUCKET',
  ADD_DATABUCKET = 'ADD_DATABUCKET',
  REMOVE_DATABUCKET = 'REMOVE_DATABUCKET',
  UPDATE_DATABUCKET = 'UPDATE_DATABUCKET',
  LOG_REQUEST = 'LOG_REQUEST',
  CLEAR_LOGS = 'CLEAR_LOGS',
  SET_ACTIVE_ENVIRONMENT_LOG = 'SET_ACTIVE_ENVIRONMENT_LOG',
  ADD_TOAST = 'ADD_TOAST',
  REMOVE_TOAST = 'REMOVE_TOAST',
  SET_USER_ID = 'SET_USER_ID',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  UPDATE_UI_STATE = 'UPDATE_UI_STATE',
  START_ROUTE_DUPLICATION_TO_ANOTHER_ENVIRONMENT = 'START_ROUTE_DUPLICATION_TO_ANOTHER_ENVIRONMENT',
  FINALIZE_ROUTE_DUPLICATION_TO_ANOTHER_ENVIRONMENT = 'FINALIZE_ROUTE_DUPLICATION_TO_ANOTHER_ENVIRONMENT',
  DUPLICATE_ROUTE_TO_ANOTHER_ENVIRONMENT = 'DUPLICATE_ROUTE_TO_ANOTHER_ENVIRONMENT',
  START_DATABUCKET_DUPLICATION_TO_ANOTHER_ENVIRONMENT = 'START_DATABUCKET_DUPLICATION_TO_ANOTHER_ENVIRONMENT',
  FINALIZE_DATABUCKET_DUPLICATION_TO_ANOTHER_ENVIRONMENT = 'FINALIZE_DATABUCKET_DUPLICATION_TO_ANOTHER_ENVIRONMENT',
  DUPLICATE_DATABUCKET_TO_ANOTHER_ENVIRONMENT = 'DUPLICATE_DATABUCKET_TO_ANOTHER_ENVIRONMENT'
}

/**
 * Change the active route tab
 *
 * @param activeTab - id of the tab to set as active
 */
export const setActiveTabAction = (activeTab: TabsNameType) =>
  ({
    type: ActionTypes.SET_ACTIVE_TAB,
    activeTab
  } as const);

/**
 * Change the active main view
 *
 * @param activeView - id of the view to set as active
 */
export const setActiveViewAction = (activeView: ViewsNameType) =>
  ({
    type: ActionTypes.SET_ACTIVE_VIEW,
    activeView
  } as const);

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
  } as const);

/**
 * Set the active environment (currently displayed)
 *
 * @param environmentUUID - UUID of the environment to switch to
 */
export const setActiveEnvironmentAction = (environmentUUID: string) =>
  ({
    type: ActionTypes.SET_ACTIVE_ENVIRONMENT,
    environmentUUID
  } as const);

/**
 * Navigate between environments
 *
 * @param direction - direction to which navigate to
 */
export const navigateEnvironmentsAction = (direction: ReducerDirectionType) =>
  ({
    type: ActionTypes.NAVIGATE_ENVIRONMENTS,
    direction
  } as const);

/**
 * Move an environment
 *
 * @param indexes - indexes to and from which move
 */
export const moveEnvironmentsAction = (indexes: ReducerIndexes) =>
  ({
    type: ActionTypes.MOVE_ENVIRONMENTS,
    indexes
  } as const);

/**
 * Move a route
 *
 * @param indexes - indexes to and from which move
 */
export const moveRoutesAction = (indexes: ReducerIndexes) =>
  ({
    type: ActionTypes.MOVE_ROUTES,
    indexes
  } as const);

/**
 * Move a route response
 *
 * @param indexes - indexes to and from which move
 */
export const moveRouteResponsesAction = (indexes: ReducerIndexes) =>
  ({
    type: ActionTypes.MOVE_ROUTE_RESPONSES,
    indexes
  } as const);

/**
 * Move a databucket
 *
 * @param indexes - indexes to and from which move
 */
export const moveDatabucketsAction = (indexes: ReducerIndexes) =>
  ({
    type: ActionTypes.MOVE_DATABUCKETS,
    indexes
  } as const);

/**
 * Add a new environment
 *
 * @param environment - environment to add
 * @param options.filePath - update the filepath
 * @param options.insertIndex - insert at index, default to end of list
 * @param options.activeEnvironment - if provided, keep another environment active instead of the one being added
 */
export const addEnvironmentAction = (
  environment: Environment,
  options?: {
    filePath?: string;
    insertAfterIndex?: number;
    activeEnvironment?: Environment;
  }
) =>
  ({
    type: ActionTypes.ADD_ENVIRONMENT,
    environment,
    ...options
  } as const);

/**
 * Remove an environment
 *
 * @param environmentUUID - environment UUID to remove
 */
export const removeEnvironmentAction = (environmentUUID: string) =>
  ({
    type: ActionTypes.REMOVE_ENVIRONMENT,
    environmentUUID
  } as const);

/**
 * Update an environment
 *
 * @param properties - properties to update
 */
export const updateEnvironmentAction = (properties: EnvironmentProperties) =>
  ({
    type: ActionTypes.UPDATE_ENVIRONMENT,
    properties
  } as const);

/**
 * Reload an environment
 *
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
  } as const);

/**
 * Update an environment status
 *
 * @param properties - properties to update
 */
export const updateEnvironmentStatusAction = (
  properties: EnvironmentStatusProperties,
  environmentUUID
) =>
  ({
    type: ActionTypes.UPDATE_ENVIRONMENT_STATUS,
    properties,
    environmentUUID
  } as const);

/**
 * Update a route filter
 *
 * @param properties - properties to update
 */
export const updateEnvironmentroutesFilterAction = (routesFilter: string) =>
  ({
    type: ActionTypes.UPDATE_ENVIRONMENT_ROUTE_FILTER,
    routesFilter
  } as const);

/**
 * Update a databucket filter
 *
 * @param databucketsFilter - databuckets filter to update
 */
export const updateEnvironmentDatabucketsFilterAction = (
  databucketsFilter: string
) =>
  ({
    type: ActionTypes.UPDATE_ENVIRONMENT_DATABUCKET_FILTER,
    databucketsFilter
  } as const);

/**
 * Set the active route (currently displayed)
 *
 * @param routeUUID - route UUID to set as active
 */
export const setActiveRouteAction = (routeUUID: string) =>
  ({
    type: ActionTypes.SET_ACTIVE_ROUTE,
    routeUUID
  } as const);

/**
 * Navigate between routes
 *
 * @param direction - direction to which navigate to
 */
export const navigateRoutesAction = (direction: ReducerDirectionType) =>
  ({
    type: ActionTypes.NAVIGATE_ROUTES,
    direction
  } as const);

/**
 * Add a route
 *
 * @param route - route to add
 */
export const addRouteAction = (route: Route, afterUUID?: string) =>
  ({
    type: ActionTypes.ADD_ROUTE,
    route,
    afterUUID
  } as const);

/**
 * Remove a route
 *
 * @param routeUUID - route UUID to remove
 */
export const removeRouteAction = (routeUUID: string) =>
  ({
    type: ActionTypes.REMOVE_ROUTE,
    routeUUID
  } as const);

/**
 * Remove the currently selected route response
 */
export const removeRouteResponseAction = () =>
  ({
    type: ActionTypes.REMOVE_ROUTE_RESPONSE
  } as const);

/**
 * Update a route
 *
 * @param properties - properties to update
 */
export const updateRouteAction = (properties: RouteProperties) =>
  ({
    type: ActionTypes.UPDATE_ROUTE,
    properties
  } as const);

/**
 * Set the active route response (currently displayed)
 *
 * @param routeResponseUUID - route response UUID to set as active
 */
export const setActiveRouteResponseAction = (routeResponseUUID: string) =>
  ({
    type: ActionTypes.SET_ACTIVE_ROUTE_RESPONSE,
    routeResponseUUID
  } as const);

/**
 * Add a new route response
 *
 * @param routeResponse - route response to add
 * @param isDuplication - (optional) indicates if the addition is a duplication.
 */
export const addRouteResponseAction = (
  routeResponse: RouteResponse,
  isDuplication?: boolean
) =>
  ({
    type: ActionTypes.ADD_ROUTE_RESPONSE,
    routeResponse,
    isDuplication
  } as const);

/**
 * Triggers movement of a route to another environment
 */
export const startRouteDuplicationToAnotherEnvironmentAction = (
  routeUUID: string
) =>
  ({
    type: ActionTypes.START_ROUTE_DUPLICATION_TO_ANOTHER_ENVIRONMENT,
    routeUUID
  } as const);

/**
 * Cancels out route movement
 */
export const finalizeRouteDuplicationToAnotherEnvironmentAction = () =>
  ({
    type: ActionTypes.FINALIZE_ROUTE_DUPLICATION_TO_ANOTHER_ENVIRONMENT
  } as const);

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
  } as const);

/**
 * Triggers movement of a route to another environment
 */
export const startDatabucketDuplicationToAnotherEnvironmentAction = (
  databucketUUID: string
) =>
  ({
    type: ActionTypes.START_DATABUCKET_DUPLICATION_TO_ANOTHER_ENVIRONMENT,
    databucketUUID
  } as const);

/**
 * Cancels out route movement
 */
export const finalizeDatabucketDuplicationToAnotherEnvironmentAction = () =>
  ({
    type: ActionTypes.FINALIZE_DATABUCKET_DUPLICATION_TO_ANOTHER_ENVIRONMENT
  } as const);

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
  } as const);

/**
 * Update the active route response
 *
 * @param properties - properties to update
 */
export const updateRouteResponseAction = (
  properties: RouteResponseProperties
) =>
  ({
    type: ActionTypes.UPDATE_ROUTE_RESPONSE,
    properties
  } as const);

/**
 * Set a route response as default
 *
 * @param routeResponseIndex - route response index
 */
export const setDefaultRouteResponseAction = (routeResponseIndex: number) =>
  ({
    type: ActionTypes.SET_DEFAULT_ROUTE_RESPONSE,
    routeResponseIndex
  } as const);

/**
 * Set the active databucket (currently displayed)
 *
 * @param databucketUUID - databucket UUID to set as active
 */
export const setActiveDatabucketAction = (databucketUUID: string) =>
  ({
    type: ActionTypes.SET_ACTIVE_DATABUCKET,
    databucketUUID
  } as const);

/**
 * Add a databucket
 *
 * @param databucket - databucket to add
 */
export const addDatabucketAction = (
  databucket: DataBucket,
  afterUUID?: string
) =>
  ({
    type: ActionTypes.ADD_DATABUCKET,
    databucket,
    afterUUID
  } as const);

/**
 * Remove a databucket
 *
 * @param databucketUUID - databucket UUID to remove
 */
export const removeDatabucketAction = (databucketUUID: string) =>
  ({
    type: ActionTypes.REMOVE_DATABUCKET,
    databucketUUID
  } as const);

/**
 * Update a databucket
 *
 * @param properties - properties to update
 */
export const updateDatabucketAction = (properties: DatabucketProperties) =>
  ({
    type: ActionTypes.UPDATE_DATABUCKET,
    properties
  } as const);

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
  } as const);

/**
 * Clear an environment logs
 *
 * @param environmentUUID - environment UUID from which logs must be cleared
 */
export const clearLogsAction = (environmentUUID: string) =>
  ({
    type: ActionTypes.CLEAR_LOGS,
    environmentUUID
  } as const);

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
  } as const);

/**
 * Add a toast
 *
 * @param toast - toast to add
 */
export const addToastAction = (toast: Toast) =>
  ({
    type: ActionTypes.ADD_TOAST,
    toast
  } as const);

/**
 * Remove a toast
 *
 * @param toastUUID - toast UUID to remove
 */
export const removeToastAction = (toastUUID: string) =>
  ({
    type: ActionTypes.REMOVE_TOAST,
    toastUUID
  } as const);

/**
 * Update user settings
 *
 * @param properties - properties to update
 */
export const updateSettingsAction = (properties: SettingsProperties) =>
  ({
    type: ActionTypes.UPDATE_SETTINGS,
    properties
  } as const);

/**
 * Update UI state
 *
 * @param properties - properties to update
 */
export const updateUIStateAction = (properties: UIStateProperties) =>
  ({
    type: ActionTypes.UPDATE_UI_STATE,
    properties
  } as const);

export type Actions =
  | ReturnType<typeof setActiveTabAction>
  | ReturnType<typeof setActiveViewAction>
  | ReturnType<typeof setActiveEnvironmentLogTabAction>
  | ReturnType<typeof setActiveEnvironmentAction>
  | ReturnType<typeof navigateEnvironmentsAction>
  | ReturnType<typeof moveEnvironmentsAction>
  | ReturnType<typeof moveRoutesAction>
  | ReturnType<typeof moveRouteResponsesAction>
  | ReturnType<typeof moveDatabucketsAction>
  | ReturnType<typeof addEnvironmentAction>
  | ReturnType<typeof removeEnvironmentAction>
  | ReturnType<typeof updateEnvironmentAction>
  | ReturnType<typeof reloadEnvironmentAction>
  | ReturnType<typeof updateEnvironmentStatusAction>
  | ReturnType<typeof updateEnvironmentroutesFilterAction>
  | ReturnType<typeof updateEnvironmentDatabucketsFilterAction>
  | ReturnType<typeof setActiveRouteAction>
  | ReturnType<typeof navigateRoutesAction>
  | ReturnType<typeof addRouteAction>
  | ReturnType<typeof removeRouteAction>
  | ReturnType<typeof removeRouteResponseAction>
  | ReturnType<typeof updateRouteAction>
  | ReturnType<typeof setActiveRouteResponseAction>
  | ReturnType<typeof addRouteResponseAction>
  | ReturnType<typeof updateRouteResponseAction>
  | ReturnType<typeof setDefaultRouteResponseAction>
  | ReturnType<typeof setActiveDatabucketAction>
  | ReturnType<typeof addDatabucketAction>
  | ReturnType<typeof removeDatabucketAction>
  | ReturnType<typeof updateDatabucketAction>
  | ReturnType<typeof logRequestAction>
  | ReturnType<typeof clearLogsAction>
  | ReturnType<typeof setActiveEnvironmentLogUUIDAction>
  | ReturnType<typeof addToastAction>
  | ReturnType<typeof removeToastAction>
  | ReturnType<typeof updateUIStateAction>
  | ReturnType<typeof updateSettingsAction>
  | ReturnType<typeof startRouteDuplicationToAnotherEnvironmentAction>
  | ReturnType<typeof finalizeRouteDuplicationToAnotherEnvironmentAction>
  | ReturnType<typeof duplicateRouteToAnotherEnvironmentAction>
  | ReturnType<typeof startDatabucketDuplicationToAnotherEnvironmentAction>
  | ReturnType<typeof finalizeDatabucketDuplicationToAnotherEnvironmentAction>
  | ReturnType<typeof duplicateDatabucketToAnotherEnvironmentAction>;
