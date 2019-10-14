import { SettingsProperties } from 'src/app/services/settings.service';
import { Toast } from 'src/app/services/toasts.service';
import { ReducerDirectionType, ReducerIndexes } from 'src/app/stores/reducer';
import { EnvironmentLogsTabsNameType, EnvironmentStatusProperties, TabsNameType, ViewsNameType } from 'src/app/stores/store';
import { Environment, EnvironmentProperties, Environments } from 'src/app/types/environment.type';
import { Route, RouteProperties, RouteResponse, RouteResponseProperties } from 'src/app/types/route.type';
import { EnvironmentLog, EnvironmentLogResponse } from 'src/app/types/server.type';

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
  LOG_RESPONSE,
  CLEAR_LOGS,
  ADD_TOAST,
  REMOVE_TOAST,
  SET_USER_ID,
  UPDATE_SETTINGS
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
export function setActiveEnvironmentLogTabAction(activeTab: EnvironmentLogsTabsNameType) {
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
export function addEnvironmentAction(environment: Environment) {
  return <const>{
    type: ActionTypes.ADD_ENVIRONMENT,
    environment
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
export function updateEnvironmentStatusAction(properties: EnvironmentStatusProperties) {
  return <const>{
    type: ActionTypes.UPDATE_ENVIRONMENT_STATUS,
    properties
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
export function addRouteAction(route: Route) {
  return <const>{
    type: ActionTypes.ADD_ROUTE,
    route
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
 * @param routeReponse - route response to add
 */
export function addRouteResponseAction(routeReponse: RouteResponse) {
  return <const>{
    type: ActionTypes.ADD_ROUTE_RESPONSE,
    routeReponse
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
 * Log an entering request
 *
 * @param environmentUUID - environment UUID to which the request is linked to
 *
 * @param logItem - logged request
 */
export function logRequestAction(environmentUUID: string, logItem: EnvironmentLog) {
  return <const>{
    type: ActionTypes.LOG_REQUEST,
    environmentUUID,
    logItem
  };
}

/**
 * Log an outgoing response
 *
 * @param environmentUUID - environment UUID to which the response is linked to
 *
 * @param logItem - logged response
 */
export function logResponseAction(environmentUUID: string, logItem: EnvironmentLogResponse) {
  return <const>{
    type: ActionTypes.LOG_RESPONSE,
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


export type Actions =
  ReturnType<typeof setActiveTabAction> |
  ReturnType<typeof setActiveViewAction> |
  ReturnType<typeof setInitialEnvironmentsAction> |
  ReturnType<typeof setActiveEnvironmentLogTabAction> |
  ReturnType<typeof setActiveEnvironmentAction> |
  ReturnType<typeof navigateEnvironmentsAction> |
  ReturnType<typeof moveEnvironmentsAction> |
  ReturnType<typeof moveRoutesAction> |
  ReturnType<typeof moveRouteResponsesAction> |
  ReturnType<typeof addEnvironmentAction> |
  ReturnType<typeof removeEnvironmentAction> |
  ReturnType<typeof updateEnvironmentAction> |
  ReturnType<typeof updateEnvironmentStatusAction> |
  ReturnType<typeof setActiveRouteAction> |
  ReturnType<typeof navigateRoutesAction> |
  ReturnType<typeof addRouteAction> |
  ReturnType<typeof addDefaultRoutesAction> |
  ReturnType<typeof removeRouteAction> |
  ReturnType<typeof removeRouteResponseAction> |
  ReturnType<typeof updateRouteAction> |
  ReturnType<typeof setActiveRouteResponseAction> |
  ReturnType<typeof addRouteResponseAction> |
  ReturnType<typeof updateRouteResponseAction> |
  ReturnType<typeof logRequestAction> |
  ReturnType<typeof logResponseAction> |
  ReturnType<typeof clearLogsAction> |
  ReturnType<typeof addToastAction> |
  ReturnType<typeof removeToastAction> |
  ReturnType<typeof setUserIdAction> |
  ReturnType<typeof updateSettingsAction>;
