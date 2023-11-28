export enum ReorderableContainers {
  ENVIRONMENTS = 'ENVIRONMENTS',
  ROUTES = 'ROUTES',
  DATABUCKETS = 'DATABUCKETS',
  ROUTE_RESPONSES = 'ROUTE_RESPONSES',
  CALLBACKS = 'CALLBACKS'
}

export enum ReorderActionType {
  BEFORE = 'BEFORE',
  INSIDE = 'INSIDE',
  AFTER = 'AFTER'
}

export type ReorderAction<T extends string | number = string | number> = {
  sourceId: T;
  sourceParentId: string | 'root';
  targetId: T;
  targetParentId: string | 'root';
  reorderActionType: ReorderActionType;
  isSourceContainer: boolean;
  isTargetContainer: boolean;
};
