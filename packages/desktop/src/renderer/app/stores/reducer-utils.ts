import {
  Environment,
  Folder,
  FolderChild,
  GetRouteResponseContentType,
  Route
} from '@mockoon/commons';
import { helpersAutocompletions } from 'src/renderer/app/constants/autocomplete.constant';
import { DropActionType } from 'src/renderer/app/enums/ui.enum';
import {
  GetEditorModeFromContentType,
  InsertAtIndex,
  isRouteDuplicates,
  RemoveAtIndex
} from 'src/renderer/app/libs/utils.lib';
import {
  DuplicatedRoutesTypes,
  StoreType
} from 'src/renderer/app/models/store.model';

/**
 * Return a Set of the duplicated route UUIDs in an environment
 *
 * @param environment
 */
const listDuplicatedRouteUUIDs = (environment: Environment): Set<string> => {
  const duplicates = new Set<string>();

  environment.routes.forEach((route: Route, routeIndex: number) => {
    environment.routes.forEach((otherRoute: Route, otherRouteIndex: number) => {
      if (
        otherRouteIndex > routeIndex &&
        isRouteDuplicates(route, otherRoute)
      ) {
        duplicates.add(otherRoute.uuid);
      }
    });
  });

  return duplicates;
};

/**
 * Mark the environment status for restart.
 * A completementary condition can be provided and an optional target environment UUID.
 *
 * @param state
 * @param condition
 * @param targetEnvironmentUUID
 * @returns
 */
export const markEnvStatusRestart = (
  state: StoreType,
  condition = true,
  targetEnvironmentUUID?: string
) => {
  targetEnvironmentUUID = targetEnvironmentUUID
    ? targetEnvironmentUUID
    : state.activeEnvironmentUUID;

  const activeEnvironmentStatus =
    state.environmentsStatus[targetEnvironmentUUID];

  const needRestart = activeEnvironmentStatus.running && condition;

  return {
    ...state.environmentsStatus,
    [targetEnvironmentUUID]: {
      ...activeEnvironmentStatus,
      needRestart
    }
  };
};

/**
 * Return the body editor "mode" from the currently selected env / route response
 *
 * @param state
 */
export const getBodyEditorMode = (state: StoreType) => {
  const currentEnvironment = state.environments.find(
    (environment) => environment.uuid === state.activeEnvironmentUUID
  );
  const currentRoute =
    currentEnvironment &&
    currentEnvironment.routes.find(
      (route) => route.uuid === state.activeRouteUUID
    );
  const currentRouteResponse =
    currentEnvironment &&
    currentRoute &&
    currentRoute.responses.find(
      (response) => response.uuid === state.activeRouteResponseUUID
    );

  if (!currentEnvironment || !currentRoute || !currentRouteResponse) {
    return 'text';
  }

  const routeResponseContentType = GetRouteResponseContentType(
    currentEnvironment,
    currentRouteResponse
  );

  return GetEditorModeFromContentType(routeResponseContentType);
};

/**
 * List duplicated routes per environment (sharing same endpoint and method)
 *
 * @param state
 */
export const updateDuplicatedRoutes = (
  state: StoreType
): DuplicatedRoutesTypes => {
  const duplicatedRoutes: DuplicatedRoutesTypes = {};

  state.environments.forEach((environment) => {
    duplicatedRoutes[environment.uuid] = listDuplicatedRouteUUIDs(environment);
  });

  return duplicatedRoutes;
};

/**
 * Move an object value from one key to another, and remove the old one.
 * Usefull when an environment UUID changes.
 *
 * @param previousKey
 * @param currentKey
 * @param target
 */
export const changeObjectKey = (
  previousKey: string,
  currentKey: string,
  target: { [key in string]: any }
) => {
  target[currentKey] = target[previousKey];
  delete target[previousKey];
};

/**
 * Create the editor autocomplete list from the current environment data buckets and helpers list
 *
 * @param state
 * @returns
 */
export const updateEditorAutocomplete = (state: StoreType) => {
  const currentEnvironment = state.environments.find(
    (environment) => environment.uuid === state.activeEnvironmentUUID
  );
  if (currentEnvironment) {
    const autoCompletions = [];
    currentEnvironment.data.forEach((databucket) => {
      autoCompletions.push(
        {
          caption: `data '${databucket.id}'`,
          value: `{{data '${databucket.id}'}}`,
          meta: `${databucket.name}`
        },
        {
          caption: `dataRaw '${databucket.id}'`,
          value: `{{dataRaw '${databucket.id}'}}`,
          meta: `${databucket.name}`
        }
      );
    });

    return [
      {
        getCompletions: (editor, session, pos, prefix, callback) => {
          callback(null, [...autoCompletions, ...helpersAutocompletions]);
        }
      }
    ];
  }

  return [];
};

/**
 * Reorganize a list of items (string or objects with UUID) by moving an item before or after a target
 * Create a copy of the array.
 *
 * @param items
 * @param actionType
 * @param sourceUUID
 * @param targetUUID
 * @returns
 */
export const moveItemAtTarget = <T extends { uuid: string } | string>(
  items: T[],
  actionType: DropActionType,
  sourceUUID: string,
  targetUUID: string
): T[] => {
  const newItems = [...items];
  const sourceIndex = newItems.findIndex(
    (arrayItem) =>
      (typeof arrayItem === 'string' ? arrayItem : arrayItem.uuid) ===
      sourceUUID
  );
  const itemToMove = RemoveAtIndex(newItems, sourceIndex);
  let targetIndex = newItems.findIndex(
    (arrayitem) =>
      (typeof arrayitem === 'string' ? arrayitem : arrayitem.uuid) ===
      targetUUID
  );
  targetIndex =
    actionType === DropActionType.AFTER ? targetIndex + 1 : targetIndex;
  InsertAtIndex(newItems, targetIndex, itemToMove);

  return newItems;
};

/**
 * Insert an item in an array before or after the target's index
 * Create a copy of the array.
 *
 * @param items
 * @param itemToInsert
 * @param actionType
 * @param targetUUID
 * @returns
 */
export const insertItemAtTarget = <T extends { uuid: string }>(
  items: T[],
  actionType: DropActionType,
  itemToInsert: T,
  targetUUID: string
) => {
  const newItems = [...items];
  const targetIndex = newItems.findIndex((item) => item.uuid === targetUUID);

  newItems.splice(
    actionType === DropActionType.BEFORE ? targetIndex : targetIndex + 1,
    0,
    itemToInsert
  );

  return newItems;
};

/**
 * Reorganize a list of items by moving an item before or after a target
 * Create a copy of the array.
 *
 * @param items
 * @param sourceIndex
 * @param targetIndex
 * @returns
 */
export const moveItemToTargetIndex = <T>(
  items: T[],
  actionType: DropActionType,
  sourceIndex: number,
  targetIndex: number
): T[] => {
  const newItems = [...items];
  const targetItem: T = items.at(targetIndex);
  const itemToMove = RemoveAtIndex(newItems, sourceIndex);
  const newTargetIndex = newItems.findIndex((item) => item === targetItem);
  InsertAtIndex(
    newItems,
    actionType === DropActionType.BEFORE ? newTargetIndex : newTargetIndex + 1,
    itemToMove
  );

  return newItems;
};

/**
 * Return the first route UUID found in the first folder or at root level
 *
 * @param foldersUUID
 * @param folders
 * @returns
 */
export const findFirstRouteUUIDInFolders = (
  children: FolderChild[],
  folders: Folder[]
): string | null => {
  for (const child of children) {
    if (child.type === 'route') {
      return child.uuid;
    } else {
      const foundFolder = folders.find((folder) => folder.uuid === child.uuid);

      if (foundFolder) {
        const routeUUID = findFirstRouteUUIDInFolders(
          foundFolder.children,
          folders
        );

        if (routeUUID) {
          return routeUUID;
        }
      }
    }
  }

  return null;
};

/**
 * Return the first route and route response UUIDs in the first folder or at root level
 *
 * @param environment
 * @returns
 */
export const getFirstRouteAndResponseUUIDs = (
  environment: Environment
): { routeUUID: string | null; routeResponseUUID: string | null } => {
  let routeUUID = null;
  let routeResponseUUID = null;
  let route: Route | null = null;

  if (!environment || environment.routes.length === 0) {
    return { routeUUID, routeResponseUUID };
  }

  routeUUID = findFirstRouteUUIDInFolders(
    environment.rootChildren,
    environment.folders
  );

  if (routeUUID) {
    route = environment.routes.find(
      (routeItem) => routeItem.uuid === routeUUID
    );

    if (route?.responses.length > 0) {
      routeResponseUUID = route.responses[0].uuid;
    }
  }

  return { routeUUID, routeResponseUUID };
};

/**
 * Return an array of parent folder UUIDs for a given route UUID, or an empty array if the route is at root level
 *
 * @param routeUUID
 * @param environment
 * @returns
 */
export const findRouteFolderHierarchy = (
  routeUUID: string,
  environment: Environment
): string[] => {
  const inRootLevel = environment.rootChildren.some(
    (child) => child.type === 'route' && child.uuid === routeUUID
  );

  if (inRootLevel) {
    return [];
  }

  const uuids: string[] = [];
  const parentFolder = environment.folders.find((folder) =>
    folder.children.some(
      (child) => child.type === 'route' && child.uuid === routeUUID
    )
  );

  if (parentFolder) {
    let parentFolderUUID = parentFolder.uuid;
    uuids.push(parentFolderUUID);

    while (parentFolderUUID !== null) {
      const secondaryParentFolder = environment.folders.find((folder) =>
        folder.children.some(
          (child) => child.type === 'folder' && child.uuid === parentFolderUUID
        )
      );

      if (secondaryParentFolder) {
        uuids.push(secondaryParentFolder.uuid);
        parentFolderUUID = secondaryParentFolder.uuid;
      } else {
        parentFolderUUID = null;
      }
    }

    return uuids;
  }

  return [];
};
