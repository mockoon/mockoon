import {
  DataBucket,
  Environment,
  Folder,
  FolderChild,
  Route,
  RouteResponse
} from '@mockoon/commons';
import { DropActionType } from 'src/renderer/app/enums/ui.enum';
import { ArrayContainsObjectKey } from 'src/renderer/app/libs/utils.lib';
import {
  EnvironmentsStatuses,
  StoreType
} from 'src/renderer/app/models/store.model';
import { Toast } from 'src/renderer/app/models/toasts.model';
import { Actions, ActionTypes } from 'src/renderer/app/stores/actions';
import {
  getBodyEditorMode,
  getFirstRouteAndResponseUUIDs,
  insertItemAtTarget,
  markEnvStatusRestart,
  moveItemAtTarget,
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
          environments: state.environments,
          routesFilter: '',
          databucketsFilter: ''
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
        environments: state.environments,
        routesFilter: '',
        databucketsFilter: ''
      };
      break;
    }

    case ActionTypes.REORGANIZE_ENVIRONMENTS: {
      newState = {
        ...state,
        environments: moveItemAtTarget<Environment>(
          state.environments,
          action.dropAction.dropActionType,
          action.dropAction.sourceId,
          action.dropAction.targetId
        ),
        settings: {
          ...state.settings,
          environments: moveItemAtTarget<EnvironmentDescriptor>(
            state.settings.environments,
            action.dropAction.dropActionType,
            action.dropAction.sourceId,
            action.dropAction.targetId
          )
        }
      };
      break;
    }

    case ActionTypes.REORGANIZE_ROUTES: {
      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === state.activeEnvironmentUUID) {
          let newRootChildren = environment.rootChildren;
          let newFolders = environment.folders;

          // remove source item UUID from it's parent container chidlren
          if (action.dropAction.sourceParentId === 'root') {
            newRootChildren = newRootChildren.filter(
              (rootChild) => rootChild.uuid !== action.dropAction.sourceId
            );
          } else {
            newFolders = newFolders.map((folder) => {
              if (folder.uuid === action.dropAction.sourceParentId) {
                return {
                  ...folder,
                  children: folder.children.filter(
                    (folderChild) =>
                      folderChild.uuid !== action.dropAction.sourceId
                  )
                };
              }

              return folder;
            });
          }

          // move in correct target (inside or before/after)
          if (
            action.dropAction.dropActionType === DropActionType.INSIDE &&
            action.dropAction.isTargetContainer
          ) {
            newFolders = newFolders.map((folder) => {
              if (folder.uuid === action.dropAction.targetId) {
                return {
                  ...folder,
                  children: [
                    ...folder.children,
                    {
                      type: action.dropAction.isSourceContainer
                        ? 'folder'
                        : 'route',
                      uuid: action.dropAction.sourceId
                    }
                  ]
                };
              }

              return folder;
            });
          } else {
            if (action.dropAction.targetParentId === 'root') {
              newRootChildren = insertItemAtTarget<FolderChild>(
                newRootChildren,
                action.dropAction.dropActionType,
                {
                  type: action.dropAction.isSourceContainer
                    ? 'folder'
                    : 'route',
                  uuid: action.dropAction.sourceId
                },
                action.dropAction.targetId
              );
            } else {
              newFolders = newFolders.map((folder) => {
                if (folder.uuid === action.dropAction.targetParentId) {
                  return {
                    ...folder,
                    children: insertItemAtTarget<FolderChild>(
                      folder.children,
                      action.dropAction.dropActionType,
                      {
                        type: action.dropAction.isSourceContainer
                          ? 'folder'
                          : 'route',
                        uuid: action.dropAction.sourceId
                      },
                      action.dropAction.targetId
                    )
                  };
                }

                return folder;
              });
            }
          }

          return {
            ...environment,
            folders: newFolders,
            rootChildren: newRootChildren
          };
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments,
        environmentsStatus: markEnvStatusRestart(state)
      };
      break;
    }

    case ActionTypes.REORGANIZE_DATABUCKETS: {
      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === state.activeEnvironmentUUID) {
          return {
            ...environment,
            data: moveItemAtTarget<DataBucket>(
              environment.data,
              action.dropAction.dropActionType,
              action.dropAction.sourceId,
              action.dropAction.targetId
            )
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

    case ActionTypes.REORGANIZE_ROUTE_RESPONSES: {
      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === state.activeEnvironmentUUID) {
          const newRoutes = environment.routes.map((route) => {
            if (route.uuid === state.activeRouteUUID) {
              return {
                ...route,
                responses: moveItemAtTarget<RouteResponse>(
                  route.responses,
                  action.dropAction.dropActionType,
                  action.dropAction.sourceId,
                  action.dropAction.targetId
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
        newState = {
          ...state,
          activeDatabucketUUID: action.databucketUUID
        };
        break;
      }

      newState = state;
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

      const {
        routeUUID: activeRouteUUID,
        routeResponseUUID: activeRouteResponseUUID
      } = getFirstRouteAndResponseUUIDs(activeEnvironment);

      newState = {
        ...state,
        activeEnvironmentUUID: activeEnvironment.uuid,
        activeRouteUUID,
        activeRouteResponseUUID,
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
        databucketsFilter: '',
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
        databucketsFilter: '',
        settings: {
          ...state.settings,
          environments: state.settings.environments.filter(
            (environment) => environment.uuid !== action.environmentUUID
          )
        }
      };

      if (state.activeEnvironmentUUID === action.environmentUUID) {
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
        environmentsStatus: markEnvStatusRestart(
          state,
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
        const {
          routeUUID: newActiveRouteUUID,
          routeResponseUUID: newActiveRouteResponseUUID
        } = getFirstRouteAndResponseUUIDs(action.newEnvironment);

        activeRouteUUID = newActiveRouteUUID;
        activeRouteResponseUUID = newActiveRouteResponseUUID;
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

      let newRootChildren = activeEnvironment.rootChildren;
      let newFolders: Folder[] = activeEnvironment.folders;

      const newRoutes = activeEnvironment.routes.filter(
        (route) => route.uuid !== action.routeUUID
      );

      // parent is root level
      if (
        activeEnvironment.rootChildren.some(
          (rootChild) => rootChild.uuid === action.routeUUID
        )
      ) {
        // remove route from root level
        newRootChildren = [
          ...activeEnvironment.rootChildren.filter(
            (rootChild) => rootChild.uuid !== action.routeUUID
          )
        ];
      } else {
        newFolders = activeEnvironment.folders.map((folder) => {
          if (
            folder.children.some((child) => child.uuid === action.routeUUID)
          ) {
            return {
              ...folder,
              children: folder.children.filter(
                (child) => child.uuid !== action.routeUUID
              )
            };
          }

          return folder;
        });
      }

      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === state.activeEnvironmentUUID) {
          return {
            ...environment,
            routes: newRoutes,
            folders: newFolders,
            rootChildren: newRootChildren
          };
        }

        return environment;
      });

      let newActiveRouteUUID = state.activeRouteUUID;
      let newActiveRouteResponseUUID = state.activeRouteResponseUUID;

      if (state.activeRouteUUID === action.routeUUID) {
        ({
          routeUUID: newActiveRouteUUID,
          routeResponseUUID: newActiveRouteResponseUUID
        } = getFirstRouteAndResponseUUIDs(activeEnvironment));
      }

      newState = {
        ...state,
        environments: newEnvironments,
        activeRouteUUID: newActiveRouteUUID,
        activeRouteResponseUUID: newActiveRouteResponseUUID,
        environmentsStatus: markEnvStatusRestart(state)
      };

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

    case ActionTypes.ADD_FOLDER: {
      newState = {
        ...state,
        environments: state.environments.map((environment) => {
          if (environment.uuid === state.activeEnvironmentUUID) {
            let rootChildren = environment.rootChildren;
            let folders = [...environment.folders];
            folders.push(action.folder);

            // add to folder or root level
            if (action.parentId === 'root') {
              rootChildren = [
                ...environment.rootChildren,
                { type: 'folder', uuid: action.folder.uuid }
              ];
            } else {
              folders = folders.map((folder) => {
                if (folder.uuid === action.parentId) {
                  return {
                    ...folder,
                    children: [
                      ...folder.children,
                      { type: 'folder', uuid: action.folder.uuid }
                    ]
                  };
                }

                return folder;
              });
            }

            return {
              ...environment,
              folders,
              rootChildren
            };
          }

          return environment;
        }),
        routesFilter: ''
      };

      break;
    }

    case ActionTypes.REMOVE_FOLDER: {
      const activeEnvironment = state.environments.find(
        (environment) => environment.uuid === state.activeEnvironmentUUID
      );

      const folderToDeleteIndex = activeEnvironment.folders.findIndex(
        (folder) => folder.uuid === action.folderUUID
      );
      const { children: folderChildren } =
        activeEnvironment.folders[folderToDeleteIndex];

      let newFolders: Folder[] = activeEnvironment.folders;
      let newRootChildren = activeEnvironment.rootChildren;

      // parent is root level
      if (
        activeEnvironment.rootChildren.some(
          (rootchild) => rootchild.uuid === action.folderUUID
        )
      ) {
        // remove folder from root level and add back children to root level
        newRootChildren = [
          ...activeEnvironment.rootChildren.filter(
            (rootChild) => rootChild.uuid !== action.folderUUID
          ),
          ...folderChildren
        ];
      } else {
        // find and remove from parent folder
        newFolders = activeEnvironment.folders.map((folder) => {
          if (
            folder.children.some((child) => child.uuid === action.folderUUID)
          ) {
            return {
              ...folder,
              children: [
                ...folder.children.filter(
                  (child) => child.uuid !== action.folderUUID
                ),
                ...folderChildren
              ]
            };
          }

          return folder;
        });
      }

      // remove folder from the list
      newFolders = newFolders.filter(
        (newFolder) => newFolder.uuid !== action.folderUUID
      );

      newState = {
        ...state,
        environments: state.environments.map((environment) => {
          if (environment.uuid === state.activeEnvironmentUUID) {
            return {
              ...environment,
              folders: newFolders,
              rootChildren: newRootChildren
            };
          }

          return environment;
        }),
        routesFilter: ''
      };

      break;
    }

    case ActionTypes.UPDATE_FOLDER: {
      newState = {
        ...state,
        environments: state.environments.map((environment) => {
          if (environment.uuid === state.activeEnvironmentUUID) {
            return {
              ...environment,
              folders: environment.folders.map((folder) => {
                if (folder.uuid === action.folderUUID) {
                  return { ...folder, ...action.properties };
                }

                return folder;
              })
            };
          }

          return environment;
        })
      };
      break;
    }

    case ActionTypes.ADD_ROUTE: {
      // only add a route if there is at least one environment
      if (state.environments.length > 0) {
        const newRoute = action.route;

        newState = {
          ...state,
          activeRouteUUID: newRoute.uuid,
          activeRouteResponseUUID: newRoute.responses[0].uuid,
          activeTab: 'RESPONSE',
          activeView: 'ENV_ROUTES',
          environments: state.environments.map((environment) => {
            if (environment.uuid === state.activeEnvironmentUUID) {
              let rootChildren = environment.rootChildren;
              const routes = [...environment.routes];
              let folders = environment.folders;

              routes.push(newRoute);

              // insert route in root or folder
              if (action.parentId === 'root') {
                rootChildren = [
                  ...environment.rootChildren,
                  { type: 'route', uuid: newRoute.uuid }
                ];
              } else {
                folders = environment.folders.map((folder) => {
                  if (folder.uuid === action.parentId) {
                    return {
                      ...folder,
                      children: [
                        ...folder.children,
                        { type: 'route', uuid: newRoute.uuid }
                      ]
                    };
                  }

                  return folder;
                });
              }

              return {
                ...environment,
                routes,
                folders,
                rootChildren
              };
            }

            return environment;
          }),
          environmentsStatus: markEnvStatusRestart(state),
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
      const specifiedUUID = action.properties.uuid;

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
        environmentsStatus: markEnvStatusRestart(
          state,
          ArrayContainsObjectKey(action.properties, propertiesNeedingRestart)
        )
      };
      break;
    }

    case ActionTypes.ADD_DATABUCKET: {
      // only add a databucket if there is at least one environment
      if (state.environments.length > 0) {
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
          environmentsStatus: markEnvStatusRestart(state),
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
      const deletedBucket = activeEnvironment.data.find(
        (databucket) => databucket.uuid === action.databucketUUID
      );

      const newDatabuckets = activeEnvironment.data.filter(
        (databucket) => databucket.uuid !== action.databucketUUID
      );

      const newRoutes = activeEnvironment.routes.map((route) => {
        let hasChanged = false;
        const newReponses = route.responses.map((response) => {
          if (response.databucketID === deletedBucket.id) {
            hasChanged = true;

            return { ...response, databucketID: '' };
          }

          return response;
        });
        if (hasChanged) {
          return { ...route, responses: newReponses };
        }

        return route;
      });

      const newEnvironments = state.environments.map((environment) => {
        if (environment.uuid === state.activeEnvironmentUUID) {
          return {
            ...environment,
            data: newDatabuckets,
            routes: newRoutes
          };
        }

        return environment;
      });

      newState = {
        ...state,
        environments: newEnvironments,
        environmentsStatus: markEnvStatusRestart(state)
      };

      if (state.activeDatabucketUUID === action.databucketUUID) {
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
      const specifiedUUID = action.properties.uuid;

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
        environmentsStatus: markEnvStatusRestart(
          state,
          ArrayContainsObjectKey(action.properties, propertiesNeedingRestart)
        )
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
        activeRouteResponseUUID: action.route.responses[0].uuid,
        activeEnvironmentUUID: action.targetEnvironmentUUID,
        activeTab: 'RESPONSE',
        activeView: 'ENV_ROUTES',
        environmentsStatus: markEnvStatusRestart(
          state,
          true,
          action.targetEnvironmentUUID
        ),
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
          true,
          action.targetEnvironmentUUID
        ),
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
      action.type === ActionTypes.REORGANIZE_ROUTES ||
      action.type === ActionTypes.DUPLICATE_ROUTE_TO_ANOTHER_ENVIRONMENT ||
      (action.type === ActionTypes.UPDATE_ROUTE &&
        action.properties &&
        (action.properties.endpoint || action.properties.method))
        ? updateDuplicatedRoutes(newState)
        : newState.duplicatedRoutes
  };

  return newState;
};
