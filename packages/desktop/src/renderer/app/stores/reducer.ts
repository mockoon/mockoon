import {
  DataBucket,
  Environment,
  Route,
  RouteResponse
} from '@mockoon/commons';
import {
  ArrayContainsObjectKey,
  MoveArrayItem
} from 'src/renderer/app/libs/utils.lib';
import {
  EnvironmentsStatuses,
  StoreType
} from 'src/renderer/app/models/store.model';
import { Toast } from 'src/renderer/app/models/toasts.model';
import { Actions, ActionTypes } from 'src/renderer/app/stores/actions';
import {
  getBodyEditorMode,
  updateDuplicatedRoutes
} from 'src/renderer/app/stores/reducer-utils';
import { EnvironmentDescriptor } from 'src/shared/models/settings.model';

export type ReducerDirectionType = 'next' | 'previous';
export type ReducerIndexes = { sourceIndex: number; targetIndex: number };

export const environmentReducer = (
  state: StoreType,
  action: Actions
): StoreType => {
  let newState: StoreType;

  switch (action.type) {
    case ActionTypes.SET_ACTIVE_TAB: {
      newState = {
        ...state,
        activeTab: action.activeTab,
        environments: state.environments
      };
      break;
    }

    case ActionTypes.SET_ACTIVE_VIEW: {
      newState = {
        ...state,
        activeView: action.activeView,
        environments: state.environments
      };
      break;
    }

    case ActionTypes.SET_ACTIVE_ENVIRONMENT_LOG_TAB: {
      newState = {
        ...state,
        activeEnvironmentLogsTab: action.activeTab,
        environments: state.environments
      };
      break;
    }

    case ActionTypes.SET_ACTIVE_ENVIRONMENT: {
      if (action.environmentUUID !== state.activeEnvironmentUUID) {
        const activeEnvironment = action.environmentUUID
          ? state.environments.find(
              (environment) => environment.uuid === action.environmentUUID
            )
          : state.environments[0];

        newState = {
          ...state,
          activeEnvironmentUUID: action.environmentUUID
            ? action.environmentUUID
            : activeEnvironment.uuid,
          activeRouteUUID: activeEnvironment.routes.length
            ? activeEnvironment.routes[0].uuid
            : null,
          activeRouteResponseUUID:
            activeEnvironment.routes.length &&
            activeEnvironment.routes[0].responses.length
              ? activeEnvironment.routes[0].responses[0].uuid
              : null,
          activeTab: 'RESPONSE',
          activeView: 'ENV_ROUTES',
          activeDatabucketUUID: activeEnvironment.data.length
            ? activeEnvironment.data[0].uuid
            : null,
          environments: state.environments,
          routesFilter: ''
        };
        break;
      }

      newState = state;
      break;
    }

    case ActionTypes.NAVIGATE_ENVIRONMENTS: {
      const activeEnvironmentIndex = state.environments.findIndex(
        (environment) => environment.uuid === state.activeEnvironmentUUID
      );

      let newEnvironment;

      if (
        action.direction === 'next' &&
        activeEnvironmentIndex < state.environments.length - 1
      ) {
        newEnvironment = state.environments[activeEnvironmentIndex + 1];
      } else if (
        action.direction === 'previous' &&
        activeEnvironmentIndex > 0
      ) {
        newEnvironment = state.environments[activeEnvironmentIndex - 1];
      } else {
        newState = state;
        break;
      }

      newState = {
        ...state,
        activeEnvironmentUUID: newEnvironment.uuid,
        activeRouteUUID: newEnvironment.routes.length
          ? newEnvironment.routes[0].uuid
          : null,
        activeRouteResponseUUID:
          newEnvironment.routes.length &&
          newEnvironment.routes[0].responses.length
            ? newEnvironment.routes[0].responses[0].uuid
            : null,
        activeTab: 'RESPONSE',
        activeView: 'ENV_ROUTES',
        activeDatabucketUUID: newEnvironment.data.length
          ? newEnvironment.data[0].uuid
          : null,
        environments: state.environments,
        routesFilter: ''
      };
      break;
    }

    case ActionTypes.MOVE_ENVIRONMENTS: {
      newState = {
        ...state,
        environments: MoveArrayItem<Environment>(
          state.environments,
          action.indexes.sourceIndex,
          action.indexes.targetIndex
        ),
        settings: {
          ...state.settings,
          environments: MoveArrayItem<EnvironmentDescriptor>(
            state.settings.environments,
            action.indexes.sourceIndex,
            action.indexes.targetIndex
          )
        }
      };
      break;
    }

    case ActionTypes.MOVE_ROUTES: {
      // reordering routes need an environment restart
      const activeEnvironmentStatus =
        state.environmentsStatus[state.activeEnvironmentUUID];

      let needRestart: boolean;
      if (activeEnvironmentStatus.running) {
        needRestart = true;
      }

      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === state.activeEnvironmentUUID) {
          return {
            ...environment,
            routes: MoveArrayItem<Route>(
              environment.routes,
              action.indexes.sourceIndex,
              action.indexes.targetIndex
            )
          };
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments,
        environmentsStatus: {
          ...state.environmentsStatus,
          [state.activeEnvironmentUUID]: {
            ...activeEnvironmentStatus,
            needRestart
          }
        }
      };
      break;
    }

    case ActionTypes.MOVE_DATABUCKETS: {
      // reordering databuckets need an environment restart
      const activeEnvironmentStatus =
        state.environmentsStatus[state.activeEnvironmentUUID];

      let needRestart: boolean;
      if (activeEnvironmentStatus.running) {
        needRestart = true;
      }

      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === state.activeEnvironmentUUID) {
          return {
            ...environment,
            data: MoveArrayItem<DataBucket>(
              environment.data,
              action.indexes.sourceIndex,
              action.indexes.targetIndex
            )
          };
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments,
        environmentsStatus: {
          ...state.environmentsStatus,
          [state.activeEnvironmentUUID]: {
            ...activeEnvironmentStatus,
            needRestart
          }
        }
      };
      break;
    }

    case ActionTypes.MOVE_ROUTE_RESPONSES: {
      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === state.activeEnvironmentUUID) {
          const newRoutes = environment.routes.map((route) => {
            if (route.uuid === state.activeRouteUUID) {
              return {
                ...route,
                responses: MoveArrayItem<RouteResponse>(
                  route.responses,
                  action.indexes.sourceIndex,
                  action.indexes.targetIndex
                )
              };
            }

            return route;
          });

          return {
            ...environment,
            routes: newRoutes
          };
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments
      };
      break;
    }

    case ActionTypes.SET_ACTIVE_ROUTE: {
      if (action.routeUUID !== state.activeRouteUUID) {
        const activeEnvironment = state.environments.find(
          (environment) => environment.uuid === state.activeEnvironmentUUID
        );
        const activeRoute = activeEnvironment.routes.find(
          (route) => route.uuid === action.routeUUID
        );

        newState = {
          ...state,
          activeRouteUUID: action.routeUUID,
          activeRouteResponseUUID: activeRoute.responses.length
            ? activeRoute.responses[0].uuid
            : null,
          activeTab: 'RESPONSE',
          activeView: 'ENV_ROUTES',
          environments: state.environments
        };
        break;
      }

      newState = state;
      break;
    }

    case ActionTypes.SET_ACTIVE_DATABUCKET: {
      if (action.databucketUUID !== state.activeDatabucketUUID) {
        const activeEnvironment = state.environments.find(
          (environment) => environment.uuid === state.activeEnvironmentUUID
        );
        const activeDatabucket = activeEnvironment.data.find(
          (databucket) => databucket.uuid === action.databucketUUID
        );

        newState = {
          ...state,
          activeDatabucketUUID: action.databucketUUID,
          activeView: 'ENV_DATABUCKETS',
          environments: state.environments
        };
        break;
      }

      newState = state;
      break;
    }

    case ActionTypes.NAVIGATE_ROUTES: {
      const activeEnvironment = state.environments.find(
        (environment) => environment.uuid === state.activeEnvironmentUUID
      );
      const activeRouteIndex = activeEnvironment.routes.findIndex(
        (route) => route.uuid === state.activeRouteUUID
      );

      let newRoute;

      if (
        action.direction === 'next' &&
        activeRouteIndex < activeEnvironment.routes.length - 1
      ) {
        newRoute = activeEnvironment.routes[activeRouteIndex + 1];
      } else if (action.direction === 'previous' && activeRouteIndex > 0) {
        newRoute = activeEnvironment.routes[activeRouteIndex - 1];
      } else {
        newState = state;
        break;
      }

      newState = {
        ...state,
        activeRouteUUID: newRoute.uuid,
        activeRouteResponseUUID: newRoute.responses.length
          ? newRoute.responses[0].uuid
          : null,
        activeTab: 'RESPONSE',
        activeView: 'ENV_ROUTES',
        environments: state.environments
      };
      break;
    }

    case ActionTypes.ADD_ENVIRONMENT: {
      const newEnvironment: Environment = action.environment;
      const activeEnvironment: Environment = action.activeEnvironment
        ? action.activeEnvironment
        : newEnvironment;
      const environments = [...state.environments];

      if (action.insertAfterIndex != null) {
        environments.splice(action.insertAfterIndex + 1, 0, newEnvironment);
      } else {
        environments.push(newEnvironment);
      }

      let newSettings = state.settings;
      // if a filePath is provided, we need to save the environment descriptor in the settings
      if (action.filePath) {
        newSettings = {
          ...state.settings,
          environments: [...state.settings.environments]
        };

        // we may be reloading or duplicating so we want to keep the descriptors order
        if (action.insertAfterIndex != null) {
          newSettings.environments.splice(action.insertAfterIndex + 1, 0, {
            uuid: newEnvironment.uuid,
            path: action.filePath
          });
        } else {
          newSettings.environments.push({
            uuid: newEnvironment.uuid,
            path: action.filePath
          });
        }
      }

      newState = {
        ...state,
        activeEnvironmentUUID: activeEnvironment.uuid,
        activeRouteUUID: activeEnvironment.routes.length
          ? activeEnvironment.routes[0].uuid
          : null,
        activeRouteResponseUUID:
          activeEnvironment.routes.length &&
          activeEnvironment.routes[0].responses.length
            ? activeEnvironment.routes[0].responses[0].uuid
            : null,
        activeTab: 'RESPONSE',
        activeView: 'ENV_ROUTES',
        activeDatabucketUUID: activeEnvironment.data.length
          ? activeEnvironment.data[0].uuid
          : null,
        environments,
        environmentsStatus: {
          ...state.environmentsStatus,
          [newEnvironment.uuid]: {
            running: false,
            needRestart: false
          }
        },
        environmentsLogs: {
          ...state.environmentsLogs,
          [newEnvironment.uuid]: []
        },
        activeEnvironmentLogsUUID: {
          ...state.activeEnvironmentLogsUUID,
          [newEnvironment.uuid]: null
        },
        routesFilter: '',
        settings: newSettings
      };
      break;
    }

    case ActionTypes.REMOVE_ENVIRONMENT: {
      const newEnvironments = state.environments.filter(
        (environment) => environment.uuid !== action.environmentUUID
      );
      const newEnvironmentsStatus = { ...state.environmentsStatus };
      delete newEnvironmentsStatus[action.environmentUUID];
      const newEnvironmentsLogs = { ...state.environmentsLogs };
      delete newEnvironmentsLogs[action.environmentUUID];
      const newActiveEnvironmentLogsUUID = {
        ...state.activeEnvironmentLogsUUID
      };
      delete newActiveEnvironmentLogsUUID[action.environmentUUID];

      newState = {
        ...state,
        environments: newEnvironments,
        environmentsStatus: newEnvironmentsStatus,
        environmentsLogs: newEnvironmentsLogs,
        activeEnvironmentLogsUUID: newActiveEnvironmentLogsUUID,
        routesFilter: '',
        settings: {
          ...state.settings,
          environments: state.settings.environments.filter(
            (environment) => environment.uuid !== action.environmentUUID
          )
        }
      };

      if (state.activeEnvironmentUUID === action.environmentUUID) {
        if (newEnvironments.length) {
          newState = {
            ...newState,
            activeEnvironmentUUID: newEnvironments[0].uuid,
            activeRouteUUID: newEnvironments[0].routes.length
              ? newEnvironments[0].routes[0].uuid
              : null,
            activeRouteResponseUUID:
              newEnvironments[0].routes.length &&
              newEnvironments[0].routes[0].responses.length
                ? newEnvironments[0].routes[0].responses[0].uuid
                : null,
            activeDatabucketUUID: newEnvironments[0].data.length
              ? newEnvironments[0].data[0].uuid
              : null
          };
        } else {
          newState = {
            ...newState,
            activeEnvironmentUUID: null,
            activeRouteUUID: null,
            activeRouteResponseUUID: null,
            activeDatabucketUUID: null
          };
        }
      }
      break;
    }

    case ActionTypes.UPDATE_ENVIRONMENT: {
      const propertiesNeedingRestart: (keyof Environment)[] = [
        'port',
        'endpointPrefix',
        'proxyMode',
        'proxyHost',
        'proxyRemovePrefix',
        'tlsOptions',
        'hostname',
        'cors'
      ];
      const activeEnvironmentStatus =
        state.environmentsStatus[state.activeEnvironmentUUID];

      let needRestart: boolean;
      if (activeEnvironmentStatus.needRestart) {
        needRestart = true;
      } else {
        needRestart =
          ArrayContainsObjectKey(action.properties, propertiesNeedingRestart) &&
          activeEnvironmentStatus.running;
      }

      newState = {
        ...state,
        environments: state.environments.map((environment) => {
          if (environment.uuid === state.activeEnvironmentUUID) {
            return {
              ...environment,
              ...action.properties
            };
          }

          return environment;
        }),
        environmentsStatus: {
          ...state.environmentsStatus,
          [state.activeEnvironmentUUID]: {
            ...activeEnvironmentStatus,
            needRestart
          }
        }
      };
      break;
    }

    case ActionTypes.RELOAD_ENVIRONMENT: {
      let activeEnvironmentUUID = state.activeEnvironmentUUID;
      let environmentsStatus = state.environmentsStatus;
      let activeRouteUUID = state.activeRouteUUID;
      let activeRouteResponseUUID = state.activeRouteResponseUUID;
      let activeDatabucketUUID = state.activeDatabucketUUID;
      let environmentsLogs = state.environmentsLogs;
      let activeEnvironmentLogsUUID = state.activeEnvironmentLogsUUID;
      let duplicatedRoutes = state.duplicatedRoutes;
      let settings = state.settings;
      let activeView = state.activeView;

      // replace environment with new content
      const environments = state.environments.map((environment) => {
        if (environment.uuid === action.previousUUID) {
          return action.newEnvironment;
        }

        return environment;
      });

      // always reset the active route, active route response and active databucket if environment was active, as UUIDs may have changed and we have no other way to match previous and current route/routeResponse items
      if (state.activeEnvironmentUUID === action.previousUUID) {
        activeRouteUUID = action.newEnvironment.routes.length
          ? action.newEnvironment.routes[0].uuid
          : null;
        activeRouteResponseUUID =
          action.newEnvironment.routes.length &&
          action.newEnvironment.routes[0].responses.length
            ? action.newEnvironment.routes[0].responses[0].uuid
            : null;
        activeDatabucketUUID = action.newEnvironment.data.length
          ? action.newEnvironment.data[0].uuid
          : null;

        // switch to the reload view as we don't have all views that can react to changes
        activeView = 'ENV_RELOAD';
      }

      // always reset env logs and the active log entry as UUIDs may have changed and we have no other way to match previous and current route/routeResponse items
      environmentsLogs = {
        ...environmentsLogs,
        [action.newEnvironment.uuid]: []
      };
      activeEnvironmentLogsUUID = {
        ...activeEnvironmentLogsUUID,
        [action.newEnvironment.uuid]: null
      };

      // if environment's UUID changed
      if (action.newEnvironment.uuid !== action.previousUUID) {
        if (state.activeEnvironmentUUID === action.previousUUID) {
          activeEnvironmentUUID = action.newEnvironment.uuid;
        }

        // eventually delete logs info stored under previous UUID
        delete environmentsLogs[action.previousUUID];
        delete activeEnvironmentLogsUUID[action.previousUUID];

        // move status to new UUID
        environmentsStatus = {
          ...environmentsStatus,
          [action.newEnvironment.uuid]: environmentsStatus[action.previousUUID]
        };
        delete environmentsStatus[action.previousUUID];

        // change UUID in settings
        settings = {
          ...settings,
          environments: settings.environments.map((environmentDescriptor) => {
            if (environmentDescriptor.uuid === action.previousUUID) {
              return {
                ...environmentDescriptor,
                uuid: action.newEnvironment.uuid
              };
            }

            return environmentDescriptor;
          })
        };
      }

      // remove needRestart from status as env will always be restarted if it was running
      environmentsStatus[action.newEnvironment.uuid] = {
        ...environmentsStatus[action.newEnvironment.uuid],
        needRestart: false
      };

      // reset the duplicated routes, as they will be refreshed and recreated
      duplicatedRoutes = { ...duplicatedRoutes };
      delete duplicatedRoutes[action.previousUUID];

      newState = {
        ...state,
        environments,
        environmentsStatus,
        activeEnvironmentUUID,
        activeRouteUUID,
        activeRouteResponseUUID,
        activeDatabucketUUID,
        environmentsLogs,
        activeEnvironmentLogsUUID,
        duplicatedRoutes,
        settings,
        activeView
      };
      break;
    }

    case ActionTypes.UPDATE_ENVIRONMENT_STATUS: {
      const newEnvironmentsStatus: EnvironmentsStatuses = {
        ...state.environmentsStatus
      };

      newEnvironmentsStatus[action.environmentUUID] = {
        ...state.environmentsStatus[action.environmentUUID],
        ...action.properties
      };

      newState = {
        ...state,
        environmentsStatus: newEnvironmentsStatus
      };
      break;
    }

    case ActionTypes.UPDATE_ENVIRONMENT_ROUTE_FILTER: {
      newState = {
        ...state,
        routesFilter: action.routesFilter
      };
      break;
    }

    case ActionTypes.UPDATE_ENVIRONMENT_DATABUCKET_FILTER: {
      newState = {
        ...state,
        databucketsFilter: action.databucketsFilter
      };
      break;
    }

    case ActionTypes.REMOVE_ROUTE: {
      const activeEnvironment = state.environments.find(
        (environment) => environment.uuid === state.activeEnvironmentUUID
      );
      const activeEnvironmentStatus =
        state.environmentsStatus[state.activeEnvironmentUUID];

      let needRestart: boolean;
      if (activeEnvironmentStatus.running) {
        needRestart = true;
      }

      const newRoutes = activeEnvironment.routes.filter(
        (route) => route.uuid !== action.routeUUID
      );

      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === state.activeEnvironmentUUID) {
          return {
            ...environment,
            routes: newRoutes
          };
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments,
        environmentsStatus: {
          ...state.environmentsStatus,
          [state.activeEnvironmentUUID]: {
            ...activeEnvironmentStatus,
            needRestart
          }
        }
      };

      if (state.activeRouteUUID === action.routeUUID) {
        if (newRoutes.length) {
          newState.activeRouteUUID = newRoutes[0].uuid;
          newState.activeRouteResponseUUID = newRoutes[0].responses.length
            ? newRoutes[0].responses[0].uuid
            : null;
        } else {
          newState.activeRouteUUID = null;
          newState.activeRouteResponseUUID = null;
        }
      }
      break;
    }

    case ActionTypes.REMOVE_ROUTE_RESPONSE: {
      const activeEnvironment = state.environments.find(
        (environment) => environment.uuid === state.activeEnvironmentUUID
      );
      const activeRoute = activeEnvironment.routes.find(
        (route) => route.uuid === state.activeRouteUUID
      );
      const newRouteResponses = activeRoute.responses.filter(
        (routeResponse) => routeResponse.uuid !== state.activeRouteResponseUUID
      );

      // mark first route response as default if needed
      const defaultRouteResponseIndex = newRouteResponses.findIndex(
        (routeResponse) => routeResponse.default
      );
      if (defaultRouteResponseIndex === -1) {
        newRouteResponses[0] = { ...newRouteResponses[0], default: true };
      }

      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === state.activeEnvironmentUUID) {
          return {
            ...environment,
            routes: environment.routes.map((route) => {
              if (route.uuid === state.activeRouteUUID) {
                return {
                  ...activeRoute,
                  responses: newRouteResponses
                };
              }

              return route;
            })
          };
        }

        return environment;
      });

      // no need to check if we have at least one route response because we cannot delete the last one anyway
      newState = {
        ...state,
        activeRouteResponseUUID: newRouteResponses[0].uuid,
        environments: newEnvironments
      };
      break;
    }

    case ActionTypes.ADD_ROUTE: {
      // only add a route if there is at least one environment
      if (state.environments.length > 0) {
        const activeEnvironmentStatus =
          state.environmentsStatus[state.activeEnvironmentUUID];

        let needRestart: boolean;
        if (activeEnvironmentStatus.running) {
          needRestart = true;
        }

        const newRoute = action.route;
        const afterUUID = action.afterUUID;

        newState = {
          ...state,
          activeRouteUUID: newRoute.uuid,
          activeRouteResponseUUID: newRoute.responses[0].uuid,
          activeTab: 'RESPONSE',
          activeView: 'ENV_ROUTES',
          environments: state.environments.map((environment) => {
            if (environment.uuid === state.activeEnvironmentUUID) {
              const routes = [...environment.routes];

              let afterIndex = routes.length;
              if (afterUUID) {
                afterIndex = environment.routes.findIndex(
                  (route) => route.uuid === afterUUID
                );
                if (afterIndex === -1) {
                  afterIndex = routes.length;
                }
              }
              routes.splice(afterIndex + 1, 0, newRoute);

              return {
                ...environment,
                routes
              };
            }

            return environment;
          }),
          environmentsStatus: {
            ...state.environmentsStatus,
            [state.activeEnvironmentUUID]: {
              ...activeEnvironmentStatus,
              needRestart
            }
          },
          routesFilter: ''
        };
        break;
      }

      newState = state;
      break;
    }

    case ActionTypes.UPDATE_ROUTE: {
      const propertiesNeedingRestart: (keyof Route)[] = [
        'endpoint',
        'method',
        'enabled'
      ];
      const activeEnvironmentStatus =
        state.environmentsStatus[state.activeEnvironmentUUID];
      let needRestart: boolean;
      const specifiedUUID = action.properties.uuid;

      if (activeEnvironmentStatus.needRestart) {
        needRestart = true;
      } else {
        needRestart =
          ArrayContainsObjectKey(action.properties, propertiesNeedingRestart) &&
          activeEnvironmentStatus.running;
      }

      newState = {
        ...state,
        environments: state.environments.map((environment) => {
          if (environment.uuid === state.activeEnvironmentUUID) {
            return {
              ...environment,
              routes: environment.routes.map((route) => {
                if (specifiedUUID) {
                  if (route.uuid === specifiedUUID) {
                    return {
                      ...route,
                      ...action.properties
                    };
                  }
                } else if (route.uuid === state.activeRouteUUID) {
                  return {
                    ...route,
                    ...action.properties
                  };
                }

                return route;
              })
            };
          }

          return environment;
        }),
        environmentsStatus: {
          ...state.environmentsStatus,
          [state.activeEnvironmentUUID]: {
            ...activeEnvironmentStatus,
            needRestart
          }
        }
      };
      break;
    }

    case ActionTypes.ADD_DATABUCKET: {
      // only add a databucket if there is at least one environment
      if (state.environments.length > 0) {
        const activeEnvironmentStatus =
          state.environmentsStatus[state.activeEnvironmentUUID];

        let needRestart: boolean;
        if (activeEnvironmentStatus.running) {
          needRestart = true;
        }

        const newDatabucket = action.databucket;
        const afterUUID = action.afterUUID;

        newState = {
          ...state,
          activeDatabucketUUID: newDatabucket.uuid,
          activeView: 'ENV_DATABUCKETS',
          environments: state.environments.map((environment) => {
            if (environment.uuid === state.activeEnvironmentUUID) {
              const data = [...environment.data];

              let afterIndex = data.length;
              if (afterUUID) {
                afterIndex = environment.data.findIndex(
                  (databucket) => databucket.uuid === afterUUID
                );
                if (afterIndex === -1) {
                  afterIndex = data.length;
                }
              }
              data.splice(afterIndex + 1, 0, newDatabucket);

              return {
                ...environment,
                data
              };
            }

            return environment;
          }),
          environmentsStatus: {
            ...state.environmentsStatus,
            [state.activeEnvironmentUUID]: {
              ...activeEnvironmentStatus,
              needRestart
            }
          },
          databucketsFilter: ''
        };
        break;
      }

      newState = state;
      break;
    }

    case ActionTypes.REMOVE_DATABUCKET: {
      const activeEnvironment = state.environments.find(
        (environment) => environment.uuid === state.activeEnvironmentUUID
      );
      const activeEnvironmentStatus =
        state.environmentsStatus[state.activeEnvironmentUUID];

      let needRestart: boolean;
      if (activeEnvironmentStatus.running) {
        needRestart = true;
      }

      const newDatabuckets = activeEnvironment.data.filter(
        (databucket) => databucket.uuid !== action.databucketUUID
      );

      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === state.activeEnvironmentUUID) {
          return {
            ...environment,
            data: newDatabuckets
          };
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments,
        environmentsStatus: {
          ...state.environmentsStatus,
          [state.activeEnvironmentUUID]: {
            ...activeEnvironmentStatus,
            needRestart
          }
        }
      };

      if (state.activeRouteUUID === action.databucketUUID) {
        if (newDatabuckets.length) {
          newState.activeDatabucketUUID = newDatabuckets[0].uuid;
        } else {
          newState.activeDatabucketUUID = null;
        }
      }
      break;
    }

    case ActionTypes.UPDATE_DATABUCKET: {
      const propertiesNeedingRestart: (keyof DataBucket)[] = ['name', 'value'];
      const activeEnvironmentStatus =
        state.environmentsStatus[state.activeEnvironmentUUID];
      let needRestart: boolean;
      const specifiedUUID = action.properties.uuid;

      console.log('updating data bucket');
      if (activeEnvironmentStatus.needRestart) {
        needRestart = true;
      } else {
        needRestart =
          ArrayContainsObjectKey(action.properties, propertiesNeedingRestart) &&
          activeEnvironmentStatus.running;
      }

      newState = {
        ...state,
        environments: state.environments.map((environment) => {
          if (environment.uuid === state.activeEnvironmentUUID) {
            return {
              ...environment,
              data: environment.data.map((data) => {
                if (specifiedUUID) {
                  if (data.uuid === specifiedUUID) {
                    return {
                      ...data,
                      ...action.properties
                    };
                  }
                } else if (data.uuid === state.activeDatabucketUUID) {
                  return {
                    ...data,
                    ...action.properties
                  };
                }

                return data;
              })
            };
          }

          return environment;
        }),
        environmentsStatus: {
          ...state.environmentsStatus,
          [state.activeEnvironmentUUID]: {
            ...activeEnvironmentStatus,
            needRestart
          }
        }
      };
      break;
    }

    case ActionTypes.SET_ACTIVE_ROUTE_RESPONSE: {
      if (action.routeResponseUUID !== state.activeRouteResponseUUID) {
        newState = {
          ...state,
          activeRouteResponseUUID: action.routeResponseUUID
        };
        break;
      }

      newState = state;
      break;
    }

    case ActionTypes.ADD_ROUTE_RESPONSE: {
      const newRouteResponse: RouteResponse = action.routeResponse;
      newState = {
        ...state,
        activeRouteResponseUUID: newRouteResponse.uuid,
        activeTab: 'RESPONSE',
        environments: state.environments.map((environment) => {
          if (environment.uuid === state.activeEnvironmentUUID) {
            return {
              ...environment,
              routes: environment.routes.map((route) => {
                if (route.uuid === state.activeRouteUUID) {
                  const responses = [...route.responses];
                  if (action.isDuplication) {
                    const activeRouteResponseIndex = route.responses.findIndex(
                      (routeResponse: RouteResponse) =>
                        routeResponse.uuid === state.activeRouteResponseUUID
                    );
                    responses.splice(
                      activeRouteResponseIndex + 1,
                      0,
                      newRouteResponse
                    );
                  } else {
                    responses.push(newRouteResponse);
                  }

                  return { ...route, responses };
                }

                return route;
              })
            };
          }

          return environment;
        })
      };
      break;
    }

    case ActionTypes.UPDATE_ROUTE_RESPONSE: {
      newState = {
        ...state,
        environments: state.environments.map((environment) => {
          if (environment.uuid === state.activeEnvironmentUUID) {
            return {
              ...environment,
              routes: environment.routes.map((route) => {
                if (route.uuid === state.activeRouteUUID) {
                  return {
                    ...route,
                    responses: route.responses.map((response) => {
                      if (response.uuid === state.activeRouteResponseUUID) {
                        return {
                          ...response,
                          ...action.properties
                        };
                      }

                      return response;
                    })
                  };
                }

                return route;
              })
            };
          }

          return environment;
        })
      };
      break;
    }

    case ActionTypes.SET_DEFAULT_ROUTE_RESPONSE: {
      newState = {
        ...state,
        environments: state.environments.map((environment) => {
          if (environment.uuid === state.activeEnvironmentUUID) {
            return {
              ...environment,
              routes: environment.routes.map((route) => {
                if (route.uuid === state.activeRouteUUID) {
                  return {
                    ...route,
                    responses: route.responses.map(
                      (response, responseIndex) => {
                        if (responseIndex === action.routeResponseIndex) {
                          return { ...response, default: true };
                        } else if (response.default) {
                          return { ...response, default: false };
                        } else {
                          return response;
                        }

                        /* if (response.uuid === state.activeRouteResponseUUID) {
                        return {
                          ...response,
                          ...action.properties
                        };
                      }

                      return response; */
                      }
                    )
                  };
                }

                return route;
              })
            };
          }

          return environment;
        })
      };
      break;
    }

    case ActionTypes.LOG_REQUEST: {
      const newEnvironmentsLogs = { ...state.environmentsLogs };

      newEnvironmentsLogs[action.environmentUUID] = [
        ...newEnvironmentsLogs[action.environmentUUID]
      ];
      newEnvironmentsLogs[action.environmentUUID].unshift(action.logItem);

      // remove one at the end if we reach maximum
      if (
        newEnvironmentsLogs[action.environmentUUID].length >
        state.settings.maxLogsPerEnvironment
      ) {
        newEnvironmentsLogs[action.environmentUUID] = newEnvironmentsLogs[
          action.environmentUUID
        ].slice(0, state.settings.maxLogsPerEnvironment);
      }

      const newActiveEnvironmentLogsUUID = {
        ...state.activeEnvironmentLogsUUID
      };
      // when receiving the first log, immediately select it
      if (newEnvironmentsLogs[action.environmentUUID].length === 1) {
        newActiveEnvironmentLogsUUID[action.environmentUUID] =
          action.logItem.UUID;
      }

      newState = {
        ...state,
        environmentsLogs: newEnvironmentsLogs,
        activeEnvironmentLogsUUID: newActiveEnvironmentLogsUUID
      };
      break;
    }

    case ActionTypes.CLEAR_LOGS: {
      newState = {
        ...state,
        environmentsLogs: {
          ...state.environmentsLogs,
          [action.environmentUUID]: []
        },
        activeEnvironmentLogsUUID: {
          ...state.activeEnvironmentLogsUUID,
          [action.environmentUUID]: null
        }
      };
      break;
    }

    case ActionTypes.SET_ACTIVE_ENVIRONMENT_LOG: {
      newState = {
        ...state,
        activeEnvironmentLogsUUID: {
          ...state.activeEnvironmentLogsUUID,
          [action.environmentUUID]: action.activeEnvironmentLogUUID
        }
      };
      break;
    }

    case ActionTypes.ADD_TOAST: {
      newState = {
        ...state,
        toasts: [...state.toasts, action.toast]
      };
      break;
    }

    case ActionTypes.REMOVE_TOAST: {
      newState = {
        ...state,
        toasts: state.toasts.filter(
          (toast: Toast) => toast.UUID !== action.toastUUID
        )
      };
      break;
    }

    case ActionTypes.UPDATE_SETTINGS: {
      newState = {
        ...state,
        settings: { ...state.settings, ...action.properties }
      };
      break;
    }

    case ActionTypes.UPDATE_UI_STATE: {
      newState = {
        ...state,
        uiState: { ...state.uiState, ...action.properties }
      };
      break;
    }

    case ActionTypes.DUPLICATE_ROUTE_TO_ANOTHER_ENVIRONMENT: {
      const { route, targetEnvironmentUUID } = action;
      const { environments } = state;
      const targetEnvironment = environments.find(
        (environment: Environment) => environment.uuid === targetEnvironmentUUID
      );
      const targetEnvironmentStatus =
        state.environmentsStatus[targetEnvironmentUUID];

      if (targetEnvironment) {
        targetEnvironment.routes.push(route);
      }

      newState = {
        ...state,
        environments: [...environments],
        activeRouteUUID: route.uuid,
        activeRouteResponseUUID: route.responses[0].uuid,
        activeEnvironmentUUID: targetEnvironmentUUID,
        activeTab: 'RESPONSE',
        activeView: 'ENV_ROUTES',
        environmentsStatus: {
          ...state.environmentsStatus,
          [targetEnvironmentUUID]: {
            ...targetEnvironmentStatus,
            needRestart: targetEnvironmentStatus.running
          }
        },
        routesFilter: ''
      };
      break;
    }

    case ActionTypes.START_ENTITY_DUPLICATION_TO_ANOTHER_ENVIRONMENT: {
      newState = {
        ...state,
        duplicateEntityToAnotherEnvironment: {
          moving: true,
          subject: action.subject,
          subjectUUID: action.subjectUUID
        }
      };
      break;
    }

    case ActionTypes.FINALIZE_ENTITY_DUPLICATION_TO_ANOTHER_ENVIRONMENT: {
      newState = {
        ...state,
        duplicateEntityToAnotherEnvironment: {
          moving: false
        }
      };
      break;
    }

    case ActionTypes.DUPLICATE_DATABUCKET_TO_ANOTHER_ENVIRONMENT: {
      const { databucket, targetEnvironmentUUID } = action;
      const { environments } = state;
      const targetEnvironment = environments.find(
        (environment: Environment) => environment.uuid === targetEnvironmentUUID
      );
      const targetEnvironmentStatus =
        state.environmentsStatus[targetEnvironmentUUID];

      if (targetEnvironment) {
        targetEnvironment.data.push(databucket);
      }

      newState = {
        ...state,
        environments: [...environments],
        activeDatabucketUUID: databucket.uuid,
        activeEnvironmentUUID: targetEnvironmentUUID,
        activeView: 'ENV_DATABUCKETS',
        environmentsStatus: {
          ...state.environmentsStatus,
          [targetEnvironmentUUID]: {
            ...targetEnvironmentStatus,
            needRestart: targetEnvironmentStatus.running
          }
        },
        databucketsFilter: ''
      };
      break;
    }

    default:
      newState = state;
      break;
  }

  newState = {
    ...newState,
    bodyEditorConfig: {
      ...newState.bodyEditorConfig,
      mode: getBodyEditorMode(newState)
    },
    duplicatedRoutes:
      action.type === ActionTypes.ADD_ENVIRONMENT ||
      action.type === ActionTypes.RELOAD_ENVIRONMENT ||
      action.type === ActionTypes.ADD_ROUTE ||
      action.type === ActionTypes.REMOVE_ROUTE ||
      action.type === ActionTypes.MOVE_ROUTES ||
      action.type === ActionTypes.DUPLICATE_ROUTE_TO_ANOTHER_ENVIRONMENT ||
      (action.type === ActionTypes.UPDATE_ROUTE &&
        action.properties &&
        (action.properties.endpoint || action.properties.method))
        ? updateDuplicatedRoutes(newState)
        : newState.duplicatedRoutes
  };

  return newState;
};
