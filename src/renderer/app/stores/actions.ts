import {
  Environment,
  Environments,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { EnvironmentLog } from 'src/renderer/app/models/environment-logs.model';
import { EnvironmentProperties } from 'src/renderer/app/models/environment.model';
import {
  RouteProperties,
  RouteResponseProperties
} from 'src/renderer/app/models/route.model';
import { SettingsProperties } from 'src/renderer/app/models/settings.model';
import { Toast } from 'src/renderer/app/models/toasts.model';
import {
  ReducerDirectionType,
  ReducerIndexes
} from 'src/renderer/app/stores/reducer';
import {
  EnvironmentLogsTabsNameType,
  EnvironmentStatusProperties,
  TabsNameType,
  UIStateProperties,
  ViewsNameType
} from 'src/renderer/app/stores/store';

export const enum ActionTypes {
  SET_ACTIVE_TAB,
  SET_ACTIVE_VIEW,
  SET_ACTIVE_ENVIRONMENT_LOG_TAB,
  SET_INITIAL_ENVIRONMENTS,
  SET_ACTIVE_ENVIRONMENT,
  NAVIGATE_ENVIRONMENTS,
  MOVE_ENVIRONMENTS,
  ADD_ENVIRONMENT,
  REMOVE_ENVIRONMENT,
  UPDATE_ENVIRONMENT,
  UPDATE_ENVIRONMENT_STATUS,
  UPDATE_ENVIRONMENT_ROUTE_FILTER,
  SET_ACTIVE_ROUTE,
  NAVIGATE_ROUTES,
  MOVE_ROUTES,
  MOVE_ROUTE_RESPONSES,
  ADD_ROUTE,
  REMOVE_ROUTE,
  REMOVE_ROUTE_RESPONSE,
  UPDATE_ROUTE,
  SET_ACTIVE_ROUTE_RESPONSE,
  ADD_ROUTE_RESPONSE,
  UPDATE_ROUTE_RESPONSE,
  LOG_REQUEST,
  CLEAR_LOGS,
  SET_ACTIVE_ENVIRONMENT_LOG,
  ADD_TOAST,
  REMOVE_TOAST,
  SET_USER_ID,
  UPDATE_SETTINGS,
  UPDATE_UI_STATE,
  START_ROUTE_DUPLICATION_TO_ANOTHER_ENVIRONMENT,
  FINALIZE_ROUTE_DUPLICATION_TO_ANOTHER_ENVIRONMENT,
  DUPLICATE_ROUTE_TO_ANOTHER_ENVIRONMENT
}

/**
 * Change the active route tab
 *
 * @param activeTab - id of the tab to set as active
 */
export const setActiveTabAction = (activeTab: TabsNameType) =>
  <const>{
    type: ActionTypes.SET_ACTIVE_TAB,
    activeTab
  };

/**
 * Change the active main view
 *
 * @param activeView - id of the view to set as active
 */
export const setActiveViewAction = (activeView: ViewsNameType) =>
  <const>{
    type: ActionTypes.SET_ACTIVE_VIEW,
    activeView
  };

/**
 * Change the active environment logs tab
 *
 * @param activeTab - id of the tab to set as active
 */
export const setActiveEnvironmentLogTabAction = (
  activeTab: EnvironmentLogsTabsNameType
) =>
  <const>{
    type: ActionTypes.SET_ACTIVE_ENVIRONMENT_LOG_TAB,
    activeTab
  };

/**
 * Set the initial environments
 *
 * @param environments - initial environments from storage
 */
export const setInitialEnvironmentsAction = (environments: Environments) =>
  <const>{
    type: ActionTypes.SET_INITIAL_ENVIRONMENTS,
    environments
  };

/**
 * Set the active environment (currently displayed)
 *
 * @param environmentUUID - UUID of the environment to switch to
 */
export const setActiveEnvironmentAction = (environmentUUID: string) =>
  <const>{
    type: ActionTypes.SET_ACTIVE_ENVIRONMENT,
    environmentUUID
  };

/**
 * Navigate between environments
 *
 * @param direction - direction to which navigate to
 */
export const navigateEnvironmentsAction = (direction: ReducerDirectionType) =>
  <const>{
    type: ActionTypes.NAVIGATE_ENVIRONMENTS,
    direction
  };

/**
 * Move an environment
 *
 * @param indexes - indexes to and from which move
 */
export const moveEnvironmentsAction = (indexes: ReducerIndexes) =>
  <const>{
    type: ActionTypes.MOVE_ENVIRONMENTS,
    indexes
  };

/**
 * Move a route
 *
 * @param indexes - indexes to and from which move
 */
export const moveRoutesAction = (indexes: ReducerIndexes) =>
  <const>{
    type: ActionTypes.MOVE_ROUTES,
    indexes
  };

/**
 * Move a route response
 *
 * @param indexes - indexes to and from which move
 */
export const moveRouteResponsesAction = (indexes: ReducerIndexes) =>
  <const>{
    type: ActionTypes.MOVE_ROUTE_RESPONSES,
    indexes
  };

/**
 * Add a new environment
 *
 * @param environment - environment to add
 */
export const addEnvironmentAction = (
  environment: Environment,
  afterUUID?: string
) =>
  <const>{
    type: ActionTypes.ADD_ENVIRONMENT,
    environment,
    afterUUID
  };

/**
 * Remove an environment
 *
 * @param environmentUUID - environment UUID to remove
 */
export const removeEnvironmentAction = (environmentUUID: string) =>
  <const>{
    type: ActionTypes.REMOVE_ENVIRONMENT,
    environmentUUID
  };

/**
 * Update an environment
 *
 * @param properties - properties to update
 */
export const updateEnvironmentAction = (properties: EnvironmentProperties) =>
  <const>{
    type: ActionTypes.UPDATE_ENVIRONMENT,
    properties
  };

/**
 * Update an environment status
 *
 * @param properties - properties to update
 */
export const updateEnvironmentStatusAction = (
  properties: EnvironmentStatusProperties,
  environmentUUID
) =>
  <const>{
    type: ActionTypes.UPDATE_ENVIRONMENT_STATUS,
    properties,
    environmentUUID
  };

/**
 * Update a route filter
 *
 * @param properties - properties to update
 */
export const updateEnvironmentroutesFilterAction = (routesFilter: string) =>
  <const>{
    type: ActionTypes.UPDATE_ENVIRONMENT_ROUTE_FILTER,
    routesFilter
  };

/**
 * Set the active route (currently displayed)
 *
 * @param routeUUID - route UUID to set as active
 */
export const setActiveRouteAction = (routeUUID: string) =>
  <const>{
    type: ActionTypes.SET_ACTIVE_ROUTE,
    routeUUID
  };

/**
 * Navigate between routes
 *
 * @param direction - direction to which navigate to
 */
export const navigateRoutesAction = (direction: ReducerDirectionType) =>
  <const>{
    type: ActionTypes.NAVIGATE_ROUTES,
    direction
  };

/**
 * Add a route
 *
 * @param route - route to add
 */
export const addRouteAction = (route: Route, afterUUID?: string) =>
  <const>{
    type: ActionTypes.ADD_ROUTE,
    route,
    afterUUID
  };

/**
 * Remove a route
 *
 * @param routeUUID - route UUID to remove
 */
export const removeRouteAction = (routeUUID: string) =>
  <const>{
    type: ActionTypes.REMOVE_ROUTE,
    routeUUID
  };

/**
 * Remove the currently selected route response
 */
export const removeRouteResponseAction = () =>
  <const>{
    type: ActionTypes.REMOVE_ROUTE_RESPONSE
  };

/**
 * Update a route
 *
 * @param properties - properties to update
 */
export const updateRouteAction = (properties: RouteProperties) =>
  <const>{
    type: ActionTypes.UPDATE_ROUTE,
    properties
  };

/**
 * Set the active route response (currently displayed)
 *
 * @param routeResponseUUID - route response UUID to set as active
 */
export const setActiveRouteResponseAction = (routeResponseUUID: string) =>
  <const>{
    type: ActionTypes.SET_ACTIVE_ROUTE_RESPONSE,
    routeResponseUUID
  };

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
  <const>{
    type: ActionTypes.ADD_ROUTE_RESPONSE,
    routeResponse,
    isDuplication
  };

/**
 * Triggers movement of a route to another environment
 */
export const startRouteDuplicationToAnotherEnvironmentAction = (
  routeUUID: string
) =>
  <const>{
    type: ActionTypes.START_ROUTE_DUPLICATION_TO_ANOTHER_ENVIRONMENT,
    routeUUID
  };

/**
 * Cancels out route movement
 */
export const finalizeRouteDuplicationToAnotherEnvironmentAction = () =>
  <const>{
    type: ActionTypes.FINALIZE_ROUTE_DUPLICATION_TO_ANOTHER_ENVIRONMENT
  };

/**
 * Finalizes route movement to another environment
 */
export const duplicateRouteToAnotherEnvironmentAction = (
  route: Route,
  targetEnvironmentUUID: string
) =>
  <const>{
    type: ActionTypes.DUPLICATE_ROUTE_TO_ANOTHER_ENVIRONMENT,
    route,
    targetEnvironmentUUID
  };

/**
 * Update a route response
 *
 * @param properties - properties to update
 */
export const updateRouteResponseAction = (
  properties: RouteResponseProperties
) =>
  <const>{
    type: ActionTypes.UPDATE_ROUTE_RESPONSE,
    properties
  };

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
  <const>{
    type: ActionTypes.LOG_REQUEST,
    environmentUUID,
    logItem
  };

/**
 * Clear an environment logs
 *
 * @param environmentUUID - environment UUID from which logs must be cleared
 */
export const clearLogsAction = (environmentUUID: string) =>
  <const>{
    type: ActionTypes.CLEAR_LOGS,
    environmentUUID
  };

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
  <const>{
    type: ActionTypes.SET_ACTIVE_ENVIRONMENT_LOG,
    environmentUUID,
    activeEnvironmentLogUUID
  };

/**
 * Add a toast
 *
 * @param toast - toast to add
 */
export const addToastAction = (toast: Toast) =>
  <const>{
    type: ActionTypes.ADD_TOAST,
    toast
  };

/**
 * Remove a toast
 *
 * @param toastUUID - toast UUID to remove
 */
export const removeToastAction = (toastUUID: string) =>
  <const>{
    type: ActionTypes.REMOVE_TOAST,
    toastUUID
  };

/**
 * Update user settings
 *
 * @param properties - properties to update
 */
export const updateSettingsAction = (properties: SettingsProperties) =>
  <const>{
    type: ActionTypes.UPDATE_SETTINGS,
    properties
  };

/**
 * Update UI state
 *
 * @param properties - properties to update
 */
export const updateUIStateAction = (properties: UIStateProperties) =>
  <const>{
    type: ActionTypes.UPDATE_UI_STATE,
    properties
  };

export type Actions =
  | ReturnType<typeof setActiveTabAction>
  | ReturnType<typeof setActiveViewAction>
  | ReturnType<typeof setInitialEnvironmentsAction>
  | ReturnType<typeof setActiveEnvironmentLogTabAction>
  | ReturnType<typeof setActiveEnvironmentAction>
  | ReturnType<typeof navigateEnvironmentsAction>
  | ReturnType<typeof moveEnvironmentsAction>
  | ReturnType<typeof moveRoutesAction>
  | ReturnType<typeof moveRouteResponsesAction>
  | ReturnType<typeof addEnvironmentAction>
  | ReturnType<typeof removeEnvironmentAction>
  | ReturnType<typeof updateEnvironmentAction>
  | ReturnType<typeof updateEnvironmentStatusAction>
  | ReturnType<typeof updateEnvironmentroutesFilterAction>
  | ReturnType<typeof setActiveRouteAction>
  | ReturnType<typeof navigateRoutesAction>
  | ReturnType<typeof addRouteAction>
  | ReturnType<typeof removeRouteAction>
  | ReturnType<typeof removeRouteResponseAction>
  | ReturnType<typeof updateRouteAction>
  | ReturnType<typeof setActiveRouteResponseAction>
  | ReturnType<typeof addRouteResponseAction>
  | ReturnType<typeof updateRouteResponseAction>
  | ReturnType<typeof logRequestAction>
  | ReturnType<typeof clearLogsAction>
  | ReturnType<typeof setActiveEnvironmentLogUUIDAction>
  | ReturnType<typeof addToastAction>
  | ReturnType<typeof removeToastAction>
  | ReturnType<typeof updateUIStateAction>
  | ReturnType<typeof updateSettingsAction>
  | ReturnType<typeof startRouteDuplicationToAnotherEnvironmentAction>
  | ReturnType<typeof finalizeRouteDuplicationToAnotherEnvironmentAction>
  | ReturnType<typeof duplicateRouteToAnotherEnvironmentAction>;
