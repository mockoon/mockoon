import {
  Environment,
  Environments,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { EnvironmentLog } from 'src/app/models/environment-logs.model';
import { EnvironmentProperties } from 'src/app/models/environment.model';
import {
  RouteProperties,
  RouteResponseProperties
} from 'src/app/models/route.model';
import { SettingsProperties } from 'src/app/models/settings.model';
import { Toast } from 'src/app/models/toasts.model';
import { ReducerDirectionType, ReducerIndexes } from 'src/app/stores/reducer';
import {
  EnvironmentLogsTabsNameType,
  EnvironmentStatusProperties,
  TabsNameType,
  UIStateProperties,
  ViewsNameType
} from 'src/app/stores/store';

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
  UPDATE_UI_STATE
}

/**
 * Change the active route tab
 *
 * @param activeTab - id of the tab to set as active
 */
export function setActiveTabAction(activeTab: TabsNameType) {
  return <const>{
    type: ActionTypes.SET_ACTIVE_TAB,
    activeTab
  };
}

/**
 * Change the active main view
 *
 * @param activeView - id of the view to set as active
 */
export function setActiveViewAction(activeView: ViewsNameType) {
  return <const>{
    type: ActionTypes.SET_ACTIVE_VIEW,
    activeView
  };
}

/**
 * Change the active environment logs tab
 *
 * @param activeTab - id of the tab to set as active
 */
export function setActiveEnvironmentLogTabAction(
  activeTab: EnvironmentLogsTabsNameType
) {
  return <const>{
    type: ActionTypes.SET_ACTIVE_ENVIRONMENT_LOG_TAB,
    activeTab
  };
}

/**
 * Set the initial environments
 *
 * @param environments - initial environments from storage
 */
export function setInitialEnvironmentsAction(environments: Environments) {
  return <const>{
    type: ActionTypes.SET_INITIAL_ENVIRONMENTS,
    environments
  };
}

/**
 * Set the active environment (currently displayed)
 *
 * @param environmentUUID - UUID of the environment to switch to
 */
export function setActiveEnvironmentAction(environmentUUID: string) {
  return <const>{
    type: ActionTypes.SET_ACTIVE_ENVIRONMENT,
    environmentUUID
  };
}

/**
 * Navigate between environments
 *
 * @param direction - direction to which navigate to
 */
export function navigateEnvironmentsAction(direction: ReducerDirectionType) {
  return <const>{
    type: ActionTypes.NAVIGATE_ENVIRONMENTS,
    direction
  };
}

/**
 * Move an environment
 *
 * @param indexes - indexes to and from which move
 */
export function moveEnvironmentsAction(indexes: ReducerIndexes) {
  return <const>{
    type: ActionTypes.MOVE_ENVIRONMENTS,
    indexes
  };
}

/**
 * Move a route
 *
 * @param indexes - indexes to and from which move
 */
export function moveRoutesAction(indexes: ReducerIndexes) {
  return <const>{
    type: ActionTypes.MOVE_ROUTES,
    indexes
  };
}

/**
 * Move a route response
 *
 * @param indexes - indexes to and from which move
 */
export function moveRouteResponsesAction(indexes: ReducerIndexes) {
  return <const>{
    type: ActionTypes.MOVE_ROUTE_RESPONSES,
    indexes
  };
}

/**
 * Add a new environment
 *
 * @param environment - environment to add
 */
export function addEnvironmentAction(
  environment: Environment,
  afterUUID?: string
) {
  return <const>{
    type: ActionTypes.ADD_ENVIRONMENT,
    environment,
    afterUUID
  };
}

/**
 * Remove an environment
 *
 * @param environmentUUID - environment UUID to remove
 */
export function removeEnvironmentAction(environmentUUID: string) {
  return <const>{
    type: ActionTypes.REMOVE_ENVIRONMENT,
    environmentUUID
  };
}

/**
 * Update an environment
 *
 * @param properties - properties to update
 */
export function updateEnvironmentAction(properties: EnvironmentProperties) {
  return <const>{
    type: ActionTypes.UPDATE_ENVIRONMENT,
    properties
  };
}

/**
 * Update an environment status
 *
 * @param properties - properties to update
 */
export function updateEnvironmentStatusAction(
  properties: EnvironmentStatusProperties,
  environmentUUID,
) {
  return <const>{
    type: ActionTypes.UPDATE_ENVIRONMENT_STATUS,
    properties,
    environmentUUID,
  };
}

/**
 * Set the active route (currently displayed)
 *
 * @param routeUUID - route UUID to set as active
 */
export function setActiveRouteAction(routeUUID: string) {
  return <const>{
    type: ActionTypes.SET_ACTIVE_ROUTE,
    routeUUID
  };
}

/**
 * Navigate between routes
 *
 * @param direction - direction to which navigate to
 */
export function navigateRoutesAction(direction: ReducerDirectionType) {
  return <const>{
    type: ActionTypes.NAVIGATE_ROUTES,
    direction
  };
}

/**
 * Add a route
 *
 * @param route - route to add
 */
export function addRouteAction(route: Route, afterUUID?: string) {
  return <const>{
    type: ActionTypes.ADD_ROUTE,
    route,
    afterUUID
  };
}

/**
 * Remove a route
 *
 * @param routeUUID - route UUID to remove
 */
export function removeRouteAction(routeUUID: string) {
  return <const>{
    type: ActionTypes.REMOVE_ROUTE,
    routeUUID
  };
}

/**
 * Remove the currently selected route response
 */
export function removeRouteResponseAction() {
  return <const>{
    type: ActionTypes.REMOVE_ROUTE_RESPONSE
  };
}

/**
 * Update a route
 *
 * @param properties - properties to update
 */
export function updateRouteAction(properties: RouteProperties) {
  return <const>{
    type: ActionTypes.UPDATE_ROUTE,
    properties
  };
}

/**
 * Set the active route response (currently displayed)
 *
 * @param routeResponseUUID - route response UUID to set as active
 */
export function setActiveRouteResponseAction(routeResponseUUID: string) {
  return <const>{
    type: ActionTypes.SET_ACTIVE_ROUTE_RESPONSE,
    routeResponseUUID
  };
}

/**
 * Add a new route response
 *
 * @param routeResponse - route response to add
 * @param isDuplication - (optional) indicates if the addition is a duplication.
 */
export function addRouteResponseAction(
  routeResponse: RouteResponse,
  isDuplication?: boolean
) {
  return <const>{
    type: ActionTypes.ADD_ROUTE_RESPONSE,
    routeResponse,
    isDuplication
  };
}

/**
 * Update a route response
 *
 * @param properties - properties to update
 */
export function updateRouteResponseAction(properties: RouteResponseProperties) {
  return <const>{
    type: ActionTypes.UPDATE_ROUTE_RESPONSE,
    properties
  };
}

/**
 * Log the request (request and response)
 *
 * @param environmentUUID - environment UUID to which the request is linked to
 *
 * @param logItem - environment log object
 */
export function logRequestAction(
  environmentUUID: string,
  logItem: EnvironmentLog
) {
  return <const>{
    type: ActionTypes.LOG_REQUEST,
    environmentUUID,
    logItem
  };
}

/**
 * Clear an environment logs
 *
 * @param environmentUUID - environment UUID from which logs must be cleared
 */
export function clearLogsAction(environmentUUID: string) {
  return <const>{
    type: ActionTypes.CLEAR_LOGS,
    environmentUUID
  };
}

/**
 * Set the active environment log UUID for a given environment
 *
 * @param environmentUUID - logs environment UUID
 * @param activeEnvironmentLogUUID - environment log UUID to set as active
 */
export function setActiveEnvironmentLogUUIDAction(
  environmentUUID: string,
  activeEnvironmentLogUUID: string
) {
  return <const>{
    type: ActionTypes.SET_ACTIVE_ENVIRONMENT_LOG,
    environmentUUID,
    activeEnvironmentLogUUID
  };
}

/**
 * Add a toast
 *
 * @param toast - toast to add
 */
export function addToastAction(toast: Toast) {
  return <const>{
    type: ActionTypes.ADD_TOAST,
    toast
  };
}

/**
 * Remove a toast
 *
 * @param toastUUID - toast UUID to remove
 */
export function removeToastAction(toastUUID: string) {
  return <const>{
    type: ActionTypes.REMOVE_TOAST,
    toastUUID
  };
}

/**
 * Set the user ID
 *
 * @param userId
 */
export function setUserIdAction(userId: string) {
  return <const>{
    type: ActionTypes.SET_USER_ID,
    userId
  };
}

/**
 * Update user settings
 *
 * @param properties - properties to update
 */
export function updateSettingsAction(properties: SettingsProperties) {
  return <const>{
    type: ActionTypes.UPDATE_SETTINGS,
    properties
  };
}

/**
 * Update UI state
 *
 * @param properties - properties to update
 */
export function updateUIStateAction(properties: UIStateProperties) {
  return <const>{
    type: ActionTypes.UPDATE_UI_STATE,
    properties
  };
}

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
  | ReturnType<typeof setUserIdAction>
  | ReturnType<typeof updateUIStateAction>
  | ReturnType<typeof updateSettingsAction>;
