export enum PostMigrationActions {
  DISABLED_ROUTES_MIGRATION = 'DISABLED_ROUTES_MIGRATION',
  COLLAPSED_FOLDERS_MIGRATION = 'COLLAPSED_FOLDERS_MIGRATION'
}

export const PostMigrationActionDisabledRoutes = (
  disabledRoutesUuids: string[]
) =>
  ({
    type: PostMigrationActions.DISABLED_ROUTES_MIGRATION,
    disabledRoutesUuids
  }) as const;

export const PostMigrationActionCollapsedFolders = (
  collapsedFoldersUuids: string[]
) =>
  ({
    type: PostMigrationActions.COLLAPSED_FOLDERS_MIGRATION,
    collapsedFoldersUuids
  }) as const;

export type PostMigrationAction =
  | ReturnType<typeof PostMigrationActionDisabledRoutes>
  | ReturnType<typeof PostMigrationActionCollapsedFolders>;
