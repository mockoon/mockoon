import { Environment } from '../models/environment.model';
import { ReorderActionType } from '../models/reorder.model';

/**
 * Remove item from array by index
 *
 * @param items
 * @returns
 */
export const removeAtIndex = <T>(items: T[], index: number): T =>
  items.splice(index, 1)[0];

/**
 * Insert item in array at index
 *
 * @param items
 * @param index
 * @param item
 * @returns
 *
 */
export const insertAtIndex = <T>(items: T[], index: number, item: T): T[] => {
  items.splice(index, 0, item);

  return items;
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
  actionType: ReorderActionType,
  itemToInsert: T,
  targetUUID: string
) => {
  const newItems = [...items];
  const targetIndex = newItems.findIndex((item) => item.uuid === targetUUID);

  newItems.splice(
    actionType === ReorderActionType.BEFORE ? targetIndex : targetIndex + 1,
    0,
    itemToInsert
  );

  return newItems;
};

/**
 * Reorder a list of items (string or objects with UUID) by moving an item before or after a target
 * Create a copy of the array.
 *
 * @param items
 * @param actionType
 * @param sourceId - can be a string id or a UUID
 * @param targetId - can be a string id or a UUID
 * @returns
 */
export const moveItemAtTarget = <T extends { uuid: string } | string>(
  items: T[],
  actionType: ReorderActionType,
  sourceId: string,
  targetId: string
): T[] => {
  const newItems = [...items];
  const sourceIndex = newItems.findIndex(
    (arrayItem) =>
      (typeof arrayItem === 'string' ? arrayItem : arrayItem.uuid) === sourceId
  );
  const itemToMove = removeAtIndex(newItems, sourceIndex);
  let targetIndex = newItems.findIndex(
    (arrayitem) =>
      (typeof arrayitem === 'string' ? arrayitem : arrayitem.uuid) === targetId
  );
  targetIndex =
    actionType === ReorderActionType.AFTER ? targetIndex + 1 : targetIndex;
  insertAtIndex(newItems, targetIndex, itemToMove);

  return newItems;
};

/**
 * Sort a list of items by a list of UUIDs
 *
 * @param items
 * @param uuids
 * @returns
 */
export const sortByUuidsList = <T extends { uuid: string }>(
  items: T[],
  uuids: string[]
): T[] => {
  const newItems = [...items];

  newItems.sort((a, b) => {
    // ensure that items not in the list are at the end
    if (!uuids.includes(a.uuid)) {
      return 1;
    }

    return uuids.indexOf(a.uuid) - uuids.indexOf(b.uuid);
  });

  return newItems;
};

/**
 * Return the current container of a route or folder
 * if not found, return null
 *
 * @param routeOrFolderUuid
 * @param environment
 */
export const findRouteOrFolderContainer = (
  routeOrFolderUuid: string,
  environment: Environment
): 'root' | string | null => {
  const inRoot = environment.rootChildren.find(
    (child) => child.uuid === routeOrFolderUuid
  );

  if (inRoot) {
    return 'root';
  }

  const container = environment.folders.find((folder) =>
    folder.children.some((child) => child.uuid === routeOrFolderUuid)
  );

  if (container) {
    return container.uuid;
  }

  return null;
};
