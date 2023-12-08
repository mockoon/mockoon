import { Callback, DataBucket, Environment } from '../models/environment.model';
import { Folder, FolderChild } from '../models/folder.model';
import { ReorderAction, ReorderActionType } from '../models/reorder.model';
import { Route, RouteResponse, RouteType } from '../models/route.model';
import { insertItemAtTarget, moveItemAtTarget } from '../utils/mutator-utils';

/**
 * Update an environment direct properties
 *
 * @param environment
 * @param properties
 * @returns
 */
export const updateEnvironmentMutator = (
  environment: Environment,
  properties: Partial<Environment>
) => ({
  ...environment,
  ...properties
});

/**
 * Add a route to an environment, and insert it in the root level or in a folder
 *
 * @param environment
 * @param newRoute
 * @param parentId
 * @returns
 */
export const addRouteMutator = (
  environment: Environment,
  newRoute: Route,
  parentId: string | 'root'
) => {
  let rootChildren = environment.rootChildren;
  const routes = [...environment.routes];
  let folders = environment.folders;

  routes.push(newRoute);

  // insert route in root level or folder
  if (parentId === 'root') {
    rootChildren = [
      ...environment.rootChildren,
      { type: 'route', uuid: newRoute.uuid }
    ];
  } else {
    folders = environment.folders.map((folder) => {
      if (folder.uuid === parentId) {
        return {
          ...folder,
          children: [...folder.children, { type: 'route', uuid: newRoute.uuid }]
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
};

/**
 * Update a route direct properties in an environment
 *
 * @param environment
 * @param routeUuid
 * @param properties
 * @returns
 */
export const updateRouteMutator = (
  environment: Environment,
  routeUuid: string,
  properties: Partial<Route>
) => ({
  ...environment,
  routes: environment.routes.map((route) => {
    if (route.uuid === routeUuid) {
      return {
        ...route,
        ...properties
      };
    }

    return route;
  })
});

/**
 * Remove a route from an environment, and remove it from the root level or from a folder
 *
 * @param environment
 * @param routeUuid
 * @returns
 */
export const removeRouteMutator = (
  environment: Environment,
  routeUuid: string
) => {
  let newRootChildren = environment.rootChildren;
  let newFolders: Folder[] = environment.folders;

  const newRoutes = environment.routes.filter(
    (route) => route.uuid !== routeUuid
  );

  // parent is root level
  if (
    environment.rootChildren.some((rootChild) => rootChild.uuid === routeUuid)
  ) {
    // remove route from root level
    newRootChildren = [
      ...environment.rootChildren.filter(
        (rootChild) => rootChild.uuid !== routeUuid
      )
    ];
  } else {
    newFolders = environment.folders.map((folder) => {
      if (folder.children.some((child) => child.uuid === routeUuid)) {
        return {
          ...folder,
          children: folder.children.filter((child) => child.uuid !== routeUuid)
        };
      }

      return folder;
    });
  }

  return {
    ...environment,
    routes: newRoutes,
    folders: newFolders,
    rootChildren: newRootChildren
  };
};

/**
 * Reorder a route in an environment
 *
 * @param environment
 * @param reorderAction
 * @returns
 */
export const reorderRoutesMutator = (
  environment: Environment,
  reorderAction: ReorderAction<string>
) => {
  let newRootChildren = environment.rootChildren;
  let newFolders = environment.folders;

  // remove source item UUID from it's parent container chidlren
  if (reorderAction.sourceParentId === 'root') {
    newRootChildren = newRootChildren.filter(
      (rootChild) => rootChild.uuid !== reorderAction.sourceId
    );
  } else {
    newFolders = newFolders.map((folder) => {
      if (folder.uuid === reorderAction.sourceParentId) {
        return {
          ...folder,
          children: folder.children.filter(
            (folderChild) => folderChild.uuid !== reorderAction.sourceId
          )
        };
      }

      return folder;
    });
  }

  // move in correct target (inside or before/after)
  if (
    reorderAction.reorderActionType === ReorderActionType.INSIDE &&
    reorderAction.isTargetContainer
  ) {
    newFolders = newFolders.map((folder) => {
      if (folder.uuid === reorderAction.targetId) {
        return {
          ...folder,
          children: [
            ...folder.children,
            {
              type: reorderAction.isSourceContainer ? 'folder' : 'route',
              uuid: reorderAction.sourceId
            }
          ]
        };
      }

      return folder;
    });
  } else {
    if (reorderAction.targetParentId === 'root') {
      newRootChildren = insertItemAtTarget<FolderChild>(
        newRootChildren,
        reorderAction.reorderActionType,
        {
          type: reorderAction.isSourceContainer ? 'folder' : 'route',
          uuid: reorderAction.sourceId
        },
        reorderAction.targetId
      );
    } else {
      newFolders = newFolders.map((folder) => {
        if (folder.uuid === reorderAction.targetParentId) {
          return {
            ...folder,
            children: insertItemAtTarget<FolderChild>(
              folder.children,
              reorderAction.reorderActionType,
              {
                type: reorderAction.isSourceContainer ? 'folder' : 'route',
                uuid: reorderAction.sourceId
              },
              reorderAction.targetId
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
};

/**
 * Reorder a route response in an environment
 *
 * @param environment
 * @param routeUuid
 * @param reorderAction
 * @returns
 */
export const reorderRouteResponseMutator = (
  environment: Environment,
  routeUuid: string,
  reorderAction: ReorderAction<string>
) => ({
  ...environment,
  routes: environment.routes.map((route) => {
    if (route.uuid === routeUuid) {
      return {
        ...route,
        responses: moveItemAtTarget<RouteResponse>(
          route.responses,
          reorderAction.reorderActionType,
          reorderAction.sourceId,
          reorderAction.targetId
        )
      };
    }

    return route;
  })
});

/**
 * Reorder a databucket in an environment
 *
 * @param environment
 * @param reorderAction
 * @returns
 */
export const reorderDatabucketMutator = (
  environment: Environment,
  reorderAction: ReorderAction<string>
) => ({
  ...environment,
  data: moveItemAtTarget<DataBucket>(
    environment.data,
    reorderAction.reorderActionType,
    reorderAction.sourceId,
    reorderAction.targetId
  )
});

/**
 *  Reorder a callback in an environment
 *
 * @param environment
 * @param reorderAction
 * @returns
 */
export const reorderCallbackMutator = (
  environment: Environment,
  reorderAction: ReorderAction<string>
) => ({
  ...environment,
  callbacks: moveItemAtTarget<Callback>(
    environment.callbacks,
    reorderAction.reorderActionType,
    reorderAction.sourceId,
    reorderAction.targetId
  )
});

/**
 * Add a folder to an environment, and insert it in the root level or in a folder
 *
 * @param environment
 * @param newFolder
 * @param parentId
 * @returns
 */
export const addFolderMutator = (
  environment: Environment,
  newFolder: Folder,
  parentId: string | 'root'
) => {
  let rootChildren = environment.rootChildren;
  let folders = [...environment.folders];
  folders.push(newFolder);

  // add to folder or root level
  if (parentId === 'root') {
    rootChildren = [
      ...environment.rootChildren,
      { type: 'folder', uuid: newFolder.uuid }
    ];
  } else {
    folders = folders.map((folder) => {
      if (folder.uuid === parentId) {
        return {
          ...folder,
          children: [
            ...folder.children,
            { type: 'folder', uuid: newFolder.uuid }
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
};

/**
 * Update a folder direct properties in an environment
 *
 * @param environment
 * @param folderUuid
 * @param properties
 * @returns
 */
export const updateFolderMutator = (
  environment: Environment,
  folderUuid: string,
  properties: Partial<Folder>
) => ({
  ...environment,
  folders: environment.folders.map((folder) => {
    if (folder.uuid === folderUuid) {
      return { ...folder, ...properties };
    }

    return folder;
  })
});

/**
 * Remove a folder from an environment, and remove it from the root level or from a folder
 * Also add back children to the root level or parent folder
 *
 * @param environment
 * @param folderUuid
 * @returns
 */
export const removeFolderMutator = (
  environment: Environment,
  folderUuid: string
) => {
  const { children: folderChildren } = environment.folders.find(
    (folder) => folder.uuid === folderUuid
  ) ?? { children: [] };

  let newFolders: Folder[] = environment.folders;
  let newRootChildren = environment.rootChildren;

  // parent is root level
  if (
    environment.rootChildren.some((rootchild) => rootchild.uuid === folderUuid)
  ) {
    // remove folder from root level and add back children to root level
    newRootChildren = [
      ...environment.rootChildren.filter(
        (rootChild) => rootChild.uuid !== folderUuid
      ),
      ...folderChildren
    ];
  } else {
    // find and remove from parent folder
    newFolders = environment.folders.map((folder) => {
      if (folder.children.some((child) => child.uuid === folderUuid)) {
        return {
          ...folder,
          children: [
            ...folder.children.filter((child) => child.uuid !== folderUuid),
            ...folderChildren
          ]
        };
      }

      return folder;
    });
  }

  // remove folder from the list
  newFolders = newFolders.filter((newFolder) => newFolder.uuid !== folderUuid);

  return {
    ...environment,
    folders: newFolders,
    rootChildren: newRootChildren
  };
};

/**
 * Insert a databucket in an environment
 *
 * @param environment
 * @param newDataBucket
 * @param insertAfterUuid
 * @returns
 */
export const addDatabucketMutator = (
  environment: Environment,
  newDatabucket: DataBucket,
  insertAfterUuid?: string
) => {
  const data = [...environment.data];

  let afterIndex = data.length;

  if (insertAfterUuid) {
    const targetIndex = environment.data.findIndex(
      (databucket) => databucket.uuid === insertAfterUuid
    );

    if (targetIndex !== -1) {
      afterIndex = targetIndex + 1;
    }
  }

  data.splice(afterIndex, 0, newDatabucket);

  return {
    ...environment,
    data
  };
};

/**
 * Update a databucket direct properties in an environment
 * @param environment
 * @param databucketUuid
 * @param properties
 * @returns
 */
export const updateDatabucketMutator = (
  environment: Environment,
  databucketUuid: string,
  properties: Partial<DataBucket>
) => ({
  ...environment,
  data: environment.data.map((databucket) => {
    if (databucket.uuid === databucketUuid) {
      return { ...databucket, ...properties };
    }

    return databucket;
  })
});

/**
 * Remove a databucket from an environment.
 * Remove the databucket id in all routes responses that use this databucket
 *
 * @param environment
 * @param databucketUuid
 */
export const removeDatabucketMutator = (
  environment: Environment,
  databucketUuid: string
) => {
  const deletedBucket = environment.data.find(
    (databucket) => databucket.uuid === databucketUuid
  );

  return {
    ...environment,
    data: environment.data.filter(
      (databucket) => databucket.uuid !== databucketUuid
    ),
    routes: environment.routes.map((route) => {
      let needsUpdate = false;

      const newReponses = route.responses.map((response) => {
        if (response.databucketID === deletedBucket?.id) {
          needsUpdate = true;

          return { ...response, databucketID: '' };
        }

        return response;
      });

      if (needsUpdate) {
        return { ...route, responses: newReponses };
      }

      return route;
    })
  };
};

/**
 * Add a route response to a route in an environment
 *
 * @param environment
 * @param routeUuid
 * @param newRouteResponse
 * @param insertAfterUuid
 * @returns
 */
export const addRouteResponseMutator = (
  environment: Environment,
  routeUuid: string,
  newRouteResponse: RouteResponse,
  insertAfterUuid?: string
) => ({
  ...environment,
  routes: environment.routes.map((route) => {
    if (route.uuid === routeUuid) {
      const responses = [...route.responses];

      let afterIndex = responses.length;

      if (insertAfterUuid) {
        const targetIndex = route.responses.findIndex(
          (routeResponse) => routeResponse.uuid === insertAfterUuid
        );

        if (targetIndex !== -1) {
          afterIndex = targetIndex + 1;
        }
      }

      responses.splice(afterIndex, 0, newRouteResponse);

      return { ...route, responses };
    }

    return route;
  })
});

/**
 * Update a route response properties in an environment
 *
 * @param environment
 * @param routeUuid
 * @param routeResponseUuid
 * @param properties
 * @returns
 */
export const updateRouteResponseMutator = (
  environment: Environment,
  routeUuid: string,
  routeResponseUuid: string,
  properties: Partial<RouteResponse>
) => ({
  ...environment,
  routes: environment.routes.map((route) => {
    if (route.uuid === routeUuid) {
      return {
        ...route,
        responses: route.responses.map((response) => {
          // if we set a route response as default, we need to remove the default flag from the previous default route response
          if (
            properties.default &&
            response.uuid !== routeResponseUuid &&
            route.type !== RouteType.CRUD &&
            response.default
          ) {
            return {
              ...response,
              default: false
            };
          }

          if (response.uuid === routeResponseUuid) {
            return {
              ...response,
              ...properties
            };
          }

          return response;
        })
      };
    }

    return route;
  })
});

/**
 * Remove a route response from a route in an environment
 *
 * @param environment
 * @param routeUuid
 * @param routeResponseUuid
 */
export const removeRouteResponseMutator = (
  environment: Environment,
  routeUuid: string,
  routeResponseUuid: string
) => ({
  ...environment,
  routes: environment.routes.map((route) => {
    if (route.uuid === routeUuid) {
      const deletedRouteResponse = route.responses.find(
        (routeResponse) => routeResponse.uuid === routeResponseUuid
      );
      const newResponses = route.responses.filter(
        (routeResponse) => routeResponse.uuid !== routeResponseUuid
      );

      if (newResponses.length > 0 && deletedRouteResponse?.default) {
        newResponses[0] = {
          ...newResponses[0],
          default: true
        };
      }

      return {
        ...route,
        responses: newResponses
      };
    }

    return route;
  })
});

/**
 * Add a callback to an environment
 *
 * @param environment
 * @param newCallback
 * @param insertAfterUuid
 */
export const addCallbackMutator = (
  environment: Environment,
  newCallback: Callback,
  insertAfterUuid?: string
) => {
  const callbacks = [...environment.callbacks];

  let afterIndex = callbacks.length;

  if (insertAfterUuid) {
    const targetIndex = environment.callbacks.findIndex(
      (callback) => callback.uuid === insertAfterUuid
    );

    if (targetIndex !== -1) {
      afterIndex = targetIndex + 1;
    }
  }

  callbacks.splice(afterIndex, 0, newCallback);

  return {
    ...environment,
    callbacks
  };
};

/**
 * Update a callback direct properties in an environment
 *
 * @param environment
 * @param callbackUuid
 * @param properties
 * @returns
 */
export const updateCallbackMutator = (
  environment: Environment,
  callbackUuid: string,
  properties: Partial<Callback>
) => ({
  ...environment,
  callbacks: environment.callbacks.map((callback) => {
    if (callback.uuid === callbackUuid) {
      return {
        ...callback,
        ...properties
      };
    }

    return callback;
  })
});

/**
 * Remove a callback from an environment
 *
 * @param environment
 * @param callbackUuid
 * @returns
 */
export const removeCallbackMutator = (
  environment: Environment,
  callbackUuid: string
) => ({
  ...environment,
  callbacks: environment.callbacks.filter(
    (callback) => callback.uuid !== callbackUuid
  ),
  routes: environment.routes.map((route) => {
    let needsUpdate = false;

    const newReponses = route.responses.map((response) => {
      if (response.callbacks.length > 0) {
        const filteredCallbacks = response.callbacks.filter(
          (callback) => callback.uuid !== callbackUuid
        );

        needsUpdate =
          needsUpdate || filteredCallbacks.length !== response.callbacks.length;

        return { ...response, callbacks: filteredCallbacks };
      }

      return response;
    });

    if (needsUpdate) {
      return { ...route, responses: newReponses };
    }

    return route;
  })
});
