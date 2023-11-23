export enum PostMigrationActions {
  DISABLED_ROUTES_MIGRATION = 'DISABLED_ROUTES_MIGRATION'
}

export const PostMigrationActionDisabledRoutes = (
  disabledRoutesUuids: string[]
) =>
  ({
    type: PostMigrationActions.DISABLED_ROUTES_MIGRATION,
    disabledRoutesUuids
  }) as const;

export type PostMigrationAction = ReturnType<
  typeof PostMigrationActionDisabledRoutes
>;
