import {
  DataBucket,
  Environment,
  FolderChild,
  Route,
  addCallbackMutator,
  addDatabucketMutator,
  addFolderMutator,
  addRouteMutator,
  addRouteResponseMutator,
  fullReorderEntitiesMutator,
  moveItemAtTarget,
  removeCallbackMutator,
  removeDatabucketMutator,
  removeFolderMutator,
  removeRouteMutator,
  removeRouteResponseMutator,
  reorderCallbackMutator,
  reorderDatabucketMutator,
  reorderRouteResponseMutator,
  reorderRoutesMutator,
  updateCallbackMutator,
  updateDatabucketMutator,
  updateEnvironmentMutator,
  updateFolderMutator,
  updateRouteMutator,
  updateRouteResponseMutator
} from '@mockoon/commons';
import { ArrayContainsObjectKey } from 'src/renderer/app/libs/utils.lib';
import {
  EnvironmentsStatuses,
  StoreType
} from 'src/renderer/app/models/store.model';
import { Toast } from 'src/renderer/app/models/toasts.model';
import { ActionTypes, Actions } from 'src/renderer/app/stores/actions';
import {
  findRouteFolderHierarchy,
  getBodyEditorMode,
  getFirstRouteAndResponseUUIDs,
  markEnvStatusRestart,
  responseTabForcedNavigation,
  updateDuplicatedRoutes,
  updateEditorAutocomplete
} from 'src/renderer/app/stores/reducer-utils';
import { EnvironmentDescriptor } from 'src/shared/models/settings.model';

export type ReducerDirectionType = 'next' | 'previous';

export const environmentReducer = (
  state: StoreType,
  action: Actions
): StoreType => {
  let newState: StoreType;

  switch (action.type) {
    case ActionTypes.CONVERT_ENVIRONMENT_TO_LOCAL: {
      newState = {
        ...state,
        settings: {
          ...state.settings,
          environments: state.settings.environments.map((environment) => {
            if (environment.uuid === action.environmentUuid) {
              return {
                ...environment,
                cloud: false
              };
            }

            return environment;
          })
        }
      };
      break;
    }

    case ActionTypes.UPDATE_USER: {
      newState = {
        ...state,
        user:
          action.properties === null
            ? null
            : { ...state.user, ...action.properties }
      };
      break;
    }

    case ActionTypes.UPDATE_SYNC: {
      newState = {
        ...state,
        sync: { ...state.sync, ...action.properties }
      };
      break;
    }

    case ActionTypes.UPDATE_DEPLOY_INSTANCES: {
      newState = {
        ...state,
        deployInstances: [...action.instances],
        environmentsStatus: {
          ...state.environmentsStatus,
          ...action.instances.reduce<EnvironmentsStatuses>(
            (instances, instance) => {
              instances[instance.environmentUuid] = {
                running: true,
                needRestart: false,
                redeploying: false
              };

              return instances;
            },
            {}
          )
        }
      };
      break;
    }

    case ActionTypes.ADD_DEPLOY_INSTANCE: {
      newState = {
        ...state,
        deployInstances: [action.instance, ...state.deployInstances],
        environmentsStatus: {
          ...state.environmentsStatus,
          [action.instance.environmentUuid]: {
            running: true,
            needRestart: false,
            redeploying: false
          }
        }
      };
      break;
    }

    case ActionTypes.UPDATE_DEPLOY_INSTANCE: {
      const newDeployInstances = state.deployInstances.map((instance) => {
        if (instance.environmentUuid === action.environmentUuid) {
          return { ...instance, ...action.properties };
        }

        return instance;
      });

      newState = {
        ...state,
        deployInstances: newDeployInstances,
        environmentsStatus: {
          ...state.environmentsStatus,
          [action.environmentUuid]: {
            running: true,
            needRestart: false,
            redeploying: false
          }
        }
      };
      break;
    }

    case ActionTypes.REMOVE_DEPLOY_INSTANCE: {
      newState = {
        ...state,
        deployInstances: state.deployInstances.filter(
          (instance) => instance.environmentUuid !== action.environmentUuid
        ),
        environmentsStatus: {
          ...state.environmentsStatus,
          [action.environmentUuid]: {
            running: false,
            needRestart: false,
            redeploying: false
          }
        }
      };
      break;
    }

    case ActionTypes.SET_ACTIVE_TAB: {
      newState = {
        ...state,
        activeTab: action.activeTab
      };
      break;
    }

    case ActionTypes.SET_ACTIVE_TAB_IN_CALLBACK: {
      newState = {
        ...state,
        callbackSettings: {
          ...state.callbackSettings,
          activeTab: action.activeTab,
          activeSpecTab: action.activeSpecTab
        }
      };
      break;
    }

    case ActionTypes.SET_ACTIVE_VIEW: {
      newState = {
        ...state,
        activeView: action.activeView
      };
      break;
    }

    case ActionTypes.SET_ACTIVE_ENVIRONMENT_LOG_TAB: {
      newState = {
        ...state,
        activeEnvironmentLogsTab: action.activeTab
      };
      break;
    }

    case ActionTypes.SET_ACTIVE_TEMPLATES_TAB: {
      newState = {
        ...state,
        activeTemplatesTab: action.activeTab
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

        const {
          routeUUID: activeRouteUUID,
          routeResponseUUID: activeRouteResponseUUID
        } = getFirstRouteAndResponseUUIDs(activeEnvironment);

        newState = {
          ...state,
          activeEnvironmentUUID: action.environmentUUID
            ? action.environmentUUID
            : activeEnvironment.uuid,
          activeRouteUUID,
          activeRouteResponseUUID,
          activeTab: 'RESPONSE',
          activeView: 'ENV_ROUTES',
          activeDatabucketUUID: activeEnvironment.data.length
            ? activeEnvironment.data[0].uuid
            : null,
          activeCallbackUUID: activeEnvironment.callbacks.length
            ? activeEnvironment.callbacks[0].uuid
            : null,
          environments: state.environments,
          filters: {
            ...state.filters,
            routes: '',
            templates: '',
            databuckets: '',
            callbacks: '',
            logs: '',
            routeResponses: ''
          },
          settings: {
            ...state.settings,
            activeEnvironmentUuid: action.environmentUUID
          }
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

      const {
        routeUUID: activeRouteUUID,
        routeResponseUUID: activeRouteResponseUUID
      } = getFirstRouteAndResponseUUIDs(newEnvironment);

      newState = {
        ...state,
        activeEnvironmentUUID: newEnvironment.uuid,
        activeRouteUUID,
        activeRouteResponseUUID,
        activeTab: 'RESPONSE',
        activeView: 'ENV_ROUTES',
        activeDatabucketUUID: newEnvironment.data.length
          ? newEnvironment.data[0].uuid
          : null,
        activeCallbackUUID: newEnvironment.callbacks.length
          ? newEnvironment.callbacks[0].uuid
          : null,
        environments: state.environments,
        filters: {
          ...state.filters,
          routes: '',
          templates: '',
          databuckets: '',
          callbacks: '',
          logs: '',
          routeResponses: ''
        }
      };
      break;
    }

    case ActionTypes.REORDER_ENVIRONMENTS: {
      newState = {
        ...state,
        environments: moveItemAtTarget<Environment>(
          state.environments,
          action.reorderAction.reorderActionType,
          action.reorderAction.sourceId,
          action.reorderAction.targetId
        ),
        settings: {
          ...state.settings,
          environments: moveItemAtTarget<EnvironmentDescriptor>(
            state.settings.environments,
            action.reorderAction.reorderActionType,
            action.reorderAction.sourceId,
            action.reorderAction.targetId
          )
        }
      };
      break;
    }

    case ActionTypes.REORDER_ROUTES: {
      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === action.environmentUuid) {
          return reorderRoutesMutator(environment, action.reorderAction);
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments,
        environmentsStatus: markEnvStatusRestart(state, action.environmentUuid)
      };
      break;
    }

    case ActionTypes.REORDER_DATABUCKETS: {
      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === action.environmentUuid) {
          return reorderDatabucketMutator(environment, action.reorderAction);
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments
      };
      break;
    }

    case ActionTypes.FULL_REORDER_ENTITIES: {
      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === action.environmentUuid) {
          return fullReorderEntitiesMutator(
            environment,
            action.entity,
            action.order,
            action.parentId
          );
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments
      };
      break;
    }

    case ActionTypes.REORDER_CALLBACKS: {
      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === action.environmentUuid) {
          return reorderCallbackMutator(environment, action.reorderAction);
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments
      };
      break;
    }

    case ActionTypes.REORDER_ROUTE_RESPONSES: {
      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === action.environmentUuid) {
          return reorderRouteResponseMutator(
            environment,
            action.routeUuid,
            action.reorderAction
          );
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
        const foldersUuidHierarchy = findRouteFolderHierarchy(
          action.routeUUID,
          activeEnvironment
        );
        let newCollapsedFolders = state.settings.collapsedFolders;

        // uncollapse folders in hierarchy if some are collapsed (selecting a route in a collapsed folder is only possible after a search)
        if (
          foldersUuidHierarchy.length > 0 &&
          newCollapsedFolders?.[activeEnvironment.uuid]?.length > 0
        ) {
          newCollapsedFolders = { ...state.settings.collapsedFolders };

          newCollapsedFolders[activeEnvironment.uuid] = newCollapsedFolders[
            activeEnvironment.uuid
          ].filter((folderUuid) => !foldersUuidHierarchy.includes(folderUuid));
        }

        newState = {
          ...state,
          activeRouteUUID: action.routeUUID,
          activeRouteResponseUUID: activeRoute.responses.length
            ? activeRoute.responses[0].uuid
            : null,
          activeTab: 'RESPONSE',
          activeView: 'ENV_ROUTES',
          settings: {
            ...state.settings,
            collapsedFolders: newCollapsedFolders
          },
          filters: {
            ...state.filters,
            routeResponses: ''
          }
        };
        break;
      }

      newState = state;
      break;
    }

    case ActionTypes.SET_ACTIVE_DATABUCKET: {
      if (action.databucketUUID !== state.activeDatabucketUUID) {
        newState = {
          ...state,
          activeDatabucketUUID: action.databucketUUID
        };
        break;
      }

      newState = state;
      break;
    }

    case ActionTypes.SET_ACTIVE_CALLBACK: {
      if (action.callbackUUID !== state.activeCallbackUUID) {
        newState = {
          ...state,
          activeCallbackUUID: action.callbackUUID
        };
        break;
      }

      newState = state;
      break;
    }

    case ActionTypes.ADD_ENVIRONMENT: {
      const newEnvironment: Environment = action.environment;
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

        const newEnvironmentDescriptor: EnvironmentDescriptor = {
          uuid: newEnvironment.uuid,
          path: action.filePath,
          cloud: action.cloud,
          lastServerHash: action.hash
        };

        // we may be reloading or duplicating so we want to keep the descriptors order
        if (action.insertAfterIndex != null) {
          newSettings.environments.splice(
            action.insertAfterIndex + 1,
            0,
            newEnvironmentDescriptor
          );
        } else {
          newSettings.environments.push(newEnvironmentDescriptor);
        }

        // add environment to the recent environments list
        if (
          !action.cloud &&
          !newSettings.recentLocalEnvironments.find(
            (recentEnvironment) => recentEnvironment.path === action.filePath
          )
        ) {
          newSettings = {
            ...newSettings,
            recentLocalEnvironments: [
              {
                name: newEnvironment.name,
                path: action.filePath
              },
              ...newSettings.recentLocalEnvironments
            ].slice(0, 8)
          };
        }
      }

      const activeUuids: Partial<StoreType> = {};

      if (action.setActive) {
        const { routeUUID, routeResponseUUID } =
          getFirstRouteAndResponseUUIDs(newEnvironment);

        activeUuids.activeEnvironmentUUID = newEnvironment.uuid;
        activeUuids.activeRouteUUID = routeUUID;
        activeUuids.activeRouteResponseUUID = routeResponseUUID;
        activeUuids.activeDatabucketUUID = newEnvironment.data.length
          ? newEnvironment.data[0].uuid
          : null;
        activeUuids.activeCallbackUUID = newEnvironment.callbacks.length
          ? newEnvironment.callbacks[0].uuid
          : null;

        newSettings.activeEnvironmentUuid = newEnvironment.uuid;
      }

      newState = {
        ...state,
        ...activeUuids,
        activeTab: 'RESPONSE',
        activeView: 'ENV_ROUTES',
        environments,
        environmentsStatus: {
          ...state.environmentsStatus,
          // use existing status if available, otherwise create a new one (status may come from the cloud instances)
          [newEnvironment.uuid]:
            state.environmentsStatus[newEnvironment.uuid] !== undefined
              ? state.environmentsStatus[newEnvironment.uuid]
              : {
                  running: false,
                  needRestart: false,
                  redeploying: false
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
        filters: {
          ...state.filters,
          routes: '',
          databuckets: '',
          templates: '',
          callbacks: '',
          logs: '',
          routeResponses: ''
        },
        settings: newSettings
      };
      break;
    }

    case ActionTypes.REMOVE_ENVIRONMENT: {
      const newEnvironments = state.environments.filter(
        (environment) => environment.uuid !== action.environmentUuid
      );
      const newEnvironmentsStatus = { ...state.environmentsStatus };
      delete newEnvironmentsStatus[action.environmentUuid];
      const newEnvironmentsLogs = { ...state.environmentsLogs };
      delete newEnvironmentsLogs[action.environmentUuid];
      const newActiveEnvironmentLogsUUID = {
        ...state.activeEnvironmentLogsUUID
      };
      delete newActiveEnvironmentLogsUUID[action.environmentUuid];

      newState = {
        ...state,
        environments: newEnvironments,
        environmentsStatus: newEnvironmentsStatus,
        environmentsLogs: newEnvironmentsLogs,
        activeEnvironmentLogsUUID: newActiveEnvironmentLogsUUID,
        filters: {
          ...state.filters,
          routes: '',
          templates: '',
          routeResponses: '',
          databuckets: '',
          callbacks: '',
          logs: ''
        },
        settings: {
          ...state.settings,
          environments: state.settings.environments.filter(
            (environment) => environment.uuid !== action.environmentUuid
          )
        }
      };

      if (state.activeEnvironmentUUID === action.environmentUuid) {
        if (newEnvironments.length) {
          const {
            routeUUID: activeRouteUUID,
            routeResponseUUID: activeRouteResponseUUID
          } = getFirstRouteAndResponseUUIDs(newEnvironments[0]);

          newState = {
            ...newState,
            activeEnvironmentUUID: newEnvironments[0].uuid,
            activeRouteUUID,
            activeRouteResponseUUID,
            activeDatabucketUUID: newEnvironments[0].data.length
              ? newEnvironments[0].data[0].uuid
              : null,
            activeCallbackUUID: newEnvironments[0].callbacks.length
              ? newEnvironments[0].callbacks[0].uuid
              : null
          };
        } else {
          newState = {
            ...newState,
            activeEnvironmentUUID: null,
            activeRouteUUID: null,
            activeRouteResponseUUID: null,
            activeDatabucketUUID: null,
            activeCallbackUUID: null
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

      newState = {
        ...state,
        environments: state.environments.map((environment) => {
          if (environment.uuid === action.environmentUuid) {
            return updateEnvironmentMutator(environment, action.properties);
          }

          return environment;
        }),
        environmentsStatus: markEnvStatusRestart(
          state,
          action.environmentUuid,
          ArrayContainsObjectKey(action.properties, propertiesNeedingRestart)
        )
      };
      break;
    }

    case ActionTypes.RELOAD_ENVIRONMENT: {
      let activeEnvironmentUUID = state.activeEnvironmentUUID;
      let environmentsStatus = state.environmentsStatus;
      let activeRouteUUID = state.activeRouteUUID;
      let activeRouteResponseUUID = state.activeRouteResponseUUID;
      let activeDatabucketUUID = state.activeDatabucketUUID;
      let activeCallbackUUID = state.activeCallbackUUID;
      let environmentsLogs = state.environmentsLogs;
      let activeEnvironmentLogsUUID = state.activeEnvironmentLogsUUID;
      let duplicatedRoutes = state.duplicatedRoutes;
      let settings = state.settings;

      // replace environment with new content
      const environments = state.environments.map((environment) => {
        if (environment.uuid === action.previousUUID) {
          return action.newEnvironment;
        }

        return environment;
      });

      // if environment's UUID changed
      if (action.newEnvironment.uuid !== action.previousUUID) {
        // if it was active env, keep it active
        if (state.activeEnvironmentUUID === action.previousUUID) {
          activeEnvironmentUUID = action.newEnvironment.uuid;
        }

        // move logs info stored under previous UUID
        environmentsLogs = {
          ...environmentsLogs,
          [action.newEnvironment.uuid]: environmentsLogs[action.previousUUID]
        };
        delete environmentsLogs[action.previousUUID];
        activeEnvironmentLogsUUID = {
          ...activeEnvironmentLogsUUID,
          [action.newEnvironment.uuid]:
            activeEnvironmentLogsUUID[action.previousUUID]
        };
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

      // if this is the currently active environment
      if (activeEnvironmentUUID === action.newEnvironment.uuid) {
        // eventually update active route and response UUIDs
        const selectedRoute = action.newEnvironment.routes.find(
          (route) => route.uuid === activeRouteUUID
        );

        if (!selectedRoute) {
          const {
            routeUUID: newActiveRouteUUID,
            routeResponseUUID: newActiveRouteResponseUUID
          } = getFirstRouteAndResponseUUIDs(action.newEnvironment);

          activeRouteUUID = newActiveRouteUUID;
          activeRouteResponseUUID = newActiveRouteResponseUUID;
        } else {
          if (
            !selectedRoute.responses.find(
              (response) => response.uuid === activeRouteResponseUUID
            )
          ) {
            activeRouteResponseUUID = selectedRoute.responses.length
              ? selectedRoute.responses[0].uuid
              : null;
          }
        }

        // eventually update active databucket UUID
        const existingDatabucket = action.newEnvironment.data.find(
          (databucket) => databucket.uuid === activeDatabucketUUID
        );

        if (!existingDatabucket) {
          activeDatabucketUUID = action.newEnvironment.data.length
            ? action.newEnvironment.data[0].uuid
            : null;
        }

        // eventually update active callback UUID
        const existingCallback = action.newEnvironment.callbacks.find(
          (callback) => callback.uuid === activeCallbackUUID
        );

        if (!existingCallback) {
          activeCallbackUUID = action.newEnvironment.callbacks.length
            ? action.newEnvironment.callbacks[0].uuid
            : null;
        }
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
        activeCallbackUUID,
        environmentsLogs,
        activeEnvironmentLogsUUID,
        duplicatedRoutes,
        settings
      };
      break;
    }

    case ActionTypes.REFRESH_ENVIRONMENT: {
      const environments = state.environments.map((environment) => {
        if (environment.uuid === action.environmentUUID) {
          return { ...environment };
        }

        return environment;
      });

      newState = {
        ...state,
        environments
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

    case ActionTypes.UPDATE_FILTER: {
      newState = {
        ...state,
        filters: { ...state.filters, [action.filter]: action.filterValue }
      };
      break;
    }

    case ActionTypes.REMOVE_ROUTE: {
      let newEnvironment: Environment;

      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === action.environmentUuid) {
          newEnvironment = removeRouteMutator(environment, action.routeUuid);

          return newEnvironment;
        }

        return environment;
      });

      let newActiveRouteUUID = state.activeRouteUUID;
      let newActiveRouteResponseUUID = state.activeRouteResponseUUID;

      if (state.activeRouteUUID === action.routeUuid) {
        ({
          routeUUID: newActiveRouteUUID,
          routeResponseUUID: newActiveRouteResponseUUID
        } = getFirstRouteAndResponseUUIDs(newEnvironment));
      }

      newState = {
        ...state,
        environments: newEnvironments,
        activeRouteUUID: newActiveRouteUUID,
        activeRouteResponseUUID: newActiveRouteResponseUUID,
        environmentsStatus: markEnvStatusRestart(state, action.environmentUuid)
      };

      break;
    }

    case ActionTypes.REMOVE_ROUTE_RESPONSE: {
      let newEnvironment: Environment;

      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === action.environmentUuid) {
          newEnvironment = removeRouteResponseMutator(
            environment,
            action.routeUuid,
            action.routeResponseUuid
          );

          return newEnvironment;
        }

        return environment;
      });

      // always focus the first route response if the active one is removed (even with cloud sync)
      const newRouteResponses = newEnvironment.routes.find(
        (route) => route.uuid === action.routeUuid
      ).responses;

      newState = {
        ...state,
        activeRouteResponseUUID:
          newRouteResponses.length > 0 ? newRouteResponses[0].uuid : null,
        environments: newEnvironments,
        activeTab:
          newRouteResponses.length > 0
            ? responseTabForcedNavigation(state, newRouteResponses[0].uuid)
            : 'RESPONSE'
      };
      break;
    }

    case ActionTypes.ADD_FOLDER: {
      let uiUpdate: Partial<StoreType> = {};

      if (action.uiReset) {
        uiUpdate = {
          filters: {
            ...state.filters,
            routes: '',
            routeResponses: ''
          }
        };
      }

      newState = {
        ...state,
        ...uiUpdate,
        environments: state.environments.map((environment) => {
          if (environment.uuid === action.environmentUuid) {
            return addFolderMutator(
              environment,
              action.folder,
              action.parentId
            );
          }

          return environment;
        })
      };

      break;
    }

    case ActionTypes.REMOVE_FOLDER: {
      newState = {
        ...state,
        environments: state.environments.map((environment) => {
          if (environment.uuid === action.environmentUuid) {
            return removeFolderMutator(environment, action.folderUuid);
          }

          return environment;
        })
      };

      break;
    }

    case ActionTypes.UPDATE_FOLDER: {
      newState = {
        ...state,
        environments: state.environments.map((environment) => {
          if (environment.uuid === action.environmentUuid) {
            return updateFolderMutator(
              environment,
              action.folderUuid,
              action.properties
            );
          }

          return environment;
        })
      };
      break;
    }

    case ActionTypes.ADD_ROUTE: {
      const newRoute = action.route;
      let uiUpdate: Partial<StoreType> = {};

      if (action.uiReset) {
        uiUpdate = {
          activeRouteUUID: newRoute.uuid,
          activeRouteResponseUUID:
            newRoute.responses.length > 0 ? newRoute.responses[0].uuid : null,
          activeTab: 'RESPONSE',
          activeView: 'ENV_ROUTES',
          filters: {
            ...state.filters,
            routes: '',
            routeResponses: ''
          }
        };
      }

      newState = {
        ...state,
        ...uiUpdate,
        environments: state.environments.map((environment) => {
          if (environment.uuid === action.environmentUuid) {
            return addRouteMutator(environment, newRoute, action.parentId);
          }

          return environment;
        }),
        environmentsStatus: markEnvStatusRestart(
          state,
          action.environmentUuid,
          true
        )
      };
      break;
    }

    case ActionTypes.UPDATE_ROUTE: {
      const propertiesNeedingRestart: (keyof Route)[] = [
        'endpoint',
        'method',
        'streamingMode',
        'streamingInterval'
      ];

      newState = {
        ...state,
        environments: state.environments.map((environment) => {
          if (environment.uuid === action.environmentUuid) {
            return updateRouteMutator(
              environment,
              action.routeUuid,
              action.properties
            );
          }

          return environment;
        }),
        environmentsStatus: markEnvStatusRestart(
          state,
          action.environmentUuid,
          ArrayContainsObjectKey(action.properties, propertiesNeedingRestart)
        )
      };
      break;
    }

    case ActionTypes.ADD_CALLBACK: {
      let uiUpdate: Partial<StoreType> = {};

      if (action.uiReset) {
        uiUpdate = {
          activeCallbackUUID: action.callback.uuid,
          activeView: 'ENV_CALLBACKS',
          callbackSettings: { activeTab: 'SPEC', activeSpecTab: 'BODY' },
          filters: {
            ...state.filters,
            callbacks: ''
          }
        };
      }

      newState = {
        ...state,
        ...uiUpdate,
        environments: state.environments.map((environment) => {
          if (environment.uuid === action.environmentUuid) {
            return addCallbackMutator(
              environment,
              action.callback,
              action.insertAfterUuid
            );
          }

          return environment;
        }),
        environmentsStatus: markEnvStatusRestart(state, action.environmentUuid)
      };
      break;
    }

    case ActionTypes.REMOVE_CALLBACK: {
      let newEnvironment: Environment;
      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === action.environmentUuid) {
          newEnvironment = removeCallbackMutator(
            environment,
            action.callbackUuid
          );

          return newEnvironment;
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments,
        environmentsStatus: markEnvStatusRestart(state, action.environmentUuid)
      };

      if (state.activeCallbackUUID === action.callbackUuid) {
        if (newEnvironment.callbacks.length > 0) {
          newState.activeCallbackUUID = newEnvironment.callbacks[0].uuid;
        } else {
          newState.activeCallbackUUID = null;
        }
      }

      break;
    }

    case ActionTypes.UPDATE_CALLBACK: {
      newState = {
        ...state,
        environments: state.environments.map((environment) => {
          if (environment.uuid === action.environmentUuid) {
            return updateCallbackMutator(
              environment,
              action.callbackUuid,
              action.properties
            );
          }

          return environment;
        })
      };
      break;
    }

    case ActionTypes.ADD_DATABUCKET: {
      const newDatabucket = action.databucket;
      let uiUpdate: Partial<StoreType> = {};

      if (action.uiReset) {
        uiUpdate = {
          activeDatabucketUUID: newDatabucket.uuid,
          activeView: 'ENV_DATABUCKETS',
          filters: {
            ...state.filters,
            databuckets: ''
          }
        };
      }

      newState = {
        ...state,
        ...uiUpdate,
        environments: state.environments.map((environment) => {
          if (environment.uuid === action.environmentUuid) {
            return addDatabucketMutator(
              environment,
              newDatabucket,
              action.insertAfterUuid
            );
          }

          return environment;
        }),
        environmentsStatus: markEnvStatusRestart(
          state,
          action.environmentUuid,
          true
        )
      };
      break;
    }

    case ActionTypes.REMOVE_DATABUCKET: {
      let newEnvironment: Environment;
      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === action.environmentUuid) {
          newEnvironment = removeDatabucketMutator(
            environment,
            action.databucketUuid
          );

          return newEnvironment;
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments,
        environmentsStatus: markEnvStatusRestart(state, action.environmentUuid)
      };

      if (state.activeDatabucketUUID === action.databucketUuid) {
        if (newEnvironment.data.length > 0) {
          newState.activeDatabucketUUID = newEnvironment.data[0].uuid;
        } else {
          newState.activeDatabucketUUID = null;
        }
      }

      break;
    }

    case ActionTypes.UPDATE_DATABUCKET: {
      const propertiesNeedingRestart: (keyof DataBucket)[] = ['name', 'value'];

      newState = {
        ...state,
        environments: state.environments.map((environment) => {
          if (environment.uuid === action.environmentUuid) {
            return updateDatabucketMutator(
              environment,
              action.databucketUuid,
              action.properties
            );
          }

          return environment;
        }),
        environmentsStatus: markEnvStatusRestart(
          state,
          action.environmentUuid,
          ArrayContainsObjectKey(action.properties, propertiesNeedingRestart)
        )
      };
      break;
    }

    case ActionTypes.SET_ACTIVE_ROUTE_RESPONSE: {
      if (action.routeResponseUUID !== state.activeRouteResponseUUID) {
        newState = {
          ...state,
          activeRouteResponseUUID: action.routeResponseUUID,
          activeTab: responseTabForcedNavigation(
            state,
            action.routeResponseUUID
          ),
          filters: {
            ...state.filters,
            routeResponses: ''
          }
        };
        break;
      }

      newState = state;
      break;
    }

    case ActionTypes.ADD_ROUTE_RESPONSE: {
      let uiUpdate: Partial<StoreType> = {};

      if (action.uiReset) {
        uiUpdate = {
          activeRouteResponseUUID: action.routeResponse.uuid,
          activeTab: 'RESPONSE'
        };
      }

      newState = {
        ...state,
        ...uiUpdate,
        environments: state.environments.map((environment) => {
          if (environment.uuid === action.environmentUuid) {
            return addRouteResponseMutator(
              environment,
              action.routeUuid,
              action.routeResponse,
              action.insertAfterUuid
            );
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
          if (environment.uuid === action.environmentUuid) {
            return updateRouteResponseMutator(
              environment,
              action.routeUuid,
              action.routeResponseUuid,
              action.properties
            );
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
        },
        filters: {
          ...state.filters,
          logs: ''
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

    case ActionTypes.UPDATE_SETTINGS_ENVIRONMENT_DESCRIPTOR: {
      newState = {
        ...state,
        settings: {
          ...state.settings,
          environments: state.settings.environments.map(
            (environmentDescriptor) => {
              if (environmentDescriptor.uuid === action.descriptor.uuid) {
                return {
                  ...environmentDescriptor,
                  ...action.descriptor
                };
              }

              return environmentDescriptor;
            }
          )
        }
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
      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === action.targetEnvironmentUUID) {
          const rootChildren: FolderChild[] = [
            ...environment.rootChildren,
            { type: 'route', uuid: action.route.uuid }
          ];

          return {
            ...environment,
            routes: [...environment.routes, action.route],
            rootChildren
          };
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments,
        activeRouteUUID: action.route.uuid,
        activeRouteResponseUUID:
          action.route.responses.length > 0
            ? action.route.responses[0].uuid
            : null,
        activeEnvironmentUUID: action.targetEnvironmentUUID,
        activeTab: 'RESPONSE',
        activeView: 'ENV_ROUTES',
        environmentsStatus: markEnvStatusRestart(
          state,
          action.targetEnvironmentUUID,
          true
        ),
        filters: {
          ...state.filters,
          routes: '',
          databuckets: '',
          templates: '',
          callbacks: '',
          logs: '',
          routeResponses: ''
        }
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

    case ActionTypes.CANCEL_ENTITY_DUPLICATION_TO_ANOTHER_ENVIRONMENT: {
      newState = {
        ...state,
        duplicateEntityToAnotherEnvironment: {
          moving: false
        }
      };
      break;
    }

    case ActionTypes.DUPLICATE_DATABUCKET_TO_ANOTHER_ENVIRONMENT: {
      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === action.targetEnvironmentUUID) {
          return {
            ...environment,
            data: [...environment.data, action.databucket]
          };
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments,
        activeDatabucketUUID: action.databucket.uuid,
        activeEnvironmentUUID: action.targetEnvironmentUUID,
        activeView: 'ENV_DATABUCKETS',

        environmentsStatus: markEnvStatusRestart(
          state,
          action.targetEnvironmentUUID,
          true
        ),
        filters: {
          ...state.filters,
          routes: '',
          databuckets: '',
          templates: '',
          callbacks: '',
          routeResponses: '',
          logs: ''
        }
      };
      break;
    }

    case ActionTypes.DUPLICATE_CALLBACK_TO_ANOTHER_ENVIRONMENT: {
      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === action.targetEnvironmentUUID) {
          return {
            ...environment,
            callbacks: [...environment.callbacks, action.callback]
          };
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments,
        activeCallbackUUID: action.callback.uuid,
        activeEnvironmentUUID: action.targetEnvironmentUUID,
        activeView: 'ENV_CALLBACKS',

        environmentsStatus: markEnvStatusRestart(
          state,
          action.targetEnvironmentUUID,
          true
        ),
        filters: {
          ...state.filters,
          callbacks: ''
        }
      };
      break;
    }

    case ActionTypes.UPDATE_PROCESSED_DATABUCKETS: {
      newState = {
        ...state,
        processedDatabuckets: {
          ...state.processedDatabuckets,
          [action.environmentUuid]: action.processedDatabuckets
            ? action.processedDatabuckets.reduce(
                (processedDatabuckets, processedDatabucket) => {
                  processedDatabuckets[processedDatabucket.uuid] =
                    processedDatabucket;

                  return processedDatabuckets;
                },
                {}
              )
            : {}
        }
      };
      break;
    }

    case ActionTypes.UPDATE_FEEDBACK: {
      newState = {
        ...state,
        feedback: action.feedback
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
      mode: getBodyEditorMode(newState),
      options: {
        ...newState.bodyEditorConfig.options,
        enableBasicAutocompletion:
          state.activeEnvironmentUUID !== newState.activeEnvironmentUUID ||
          action.type === ActionTypes.ADD_DATABUCKET ||
          action.type === ActionTypes.REMOVE_DATABUCKET ||
          action.type === ActionTypes.UPDATE_DATABUCKET
            ? updateEditorAutocomplete(newState)
            : newState.bodyEditorConfig.options.enableBasicAutocompletion
      }
    },
    duplicatedRoutes:
      action.type === ActionTypes.ADD_ENVIRONMENT ||
      action.type === ActionTypes.RELOAD_ENVIRONMENT ||
      action.type === ActionTypes.ADD_ROUTE ||
      action.type === ActionTypes.REMOVE_ROUTE ||
      action.type === ActionTypes.REORDER_ROUTES ||
      action.type === ActionTypes.DUPLICATE_ROUTE_TO_ANOTHER_ENVIRONMENT ||
      (action.type === ActionTypes.UPDATE_ROUTE &&
        action.properties &&
        (action.properties.endpoint || action.properties.method))
        ? updateDuplicatedRoutes(newState)
        : newState.duplicatedRoutes
  };

  return newState;
};
