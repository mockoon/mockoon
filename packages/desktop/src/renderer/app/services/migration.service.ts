import { Injectable } from '@angular/core';
import {
  Environment,
  HighestMigrationId,
  Migrations,
  PostMigrationAction,
  PostMigrationActions
} from '@mockoon/commons';
import { Logger } from 'src/renderer/app/classes/logger';
import { SettingsService } from 'src/renderer/app/services/settings.service';

@Injectable({ providedIn: 'root' })
export class MigrationService extends Logger {
  constructor(private settingsService: SettingsService) {
    super('[RENDERER][SERVICE][MIGRATION] ');
  }

  /**
   * Migrate one environment.
   * Will automatically check the last migration done on the environment and apply the most recent
   */
  public migrateEnvironment(environment: Environment) {
    const migrationStartId = this.getMigrationStartId(environment);

    if (migrationStartId > -1) {
      this.logMessage('info', 'MIGRATING_ENVIRONMENT', {
        environmentUUID: environment.uuid,
        environmentName: environment.name,
        migrationStartId
      });

      Migrations.forEach((migration) => {
        if (migration.id > migrationStartId) {
          const postMigrationAction = migration.migrationFunction(environment);
          environment.lastMigration = migration.id;

          if (postMigrationAction) {
            this.postMigrationAction(environment, postMigrationAction);
          }
        }
      });
    }

    return environment;
  }

  /**
   * Execute a post migration action
   *
   * @param environment
   * @param postMigrationAction
   */
  private postMigrationAction(
    environment: Environment,
    postMigrationAction: PostMigrationAction
  ) {
    switch (postMigrationAction.type) {
      case PostMigrationActions.DISABLED_ROUTES_MIGRATION:
        if (postMigrationAction.disabledRoutesUuids.length > 0) {
          this.settingsService.updateSettings({
            disabledRoutes: {
              ...this.settingsService.getSettings().disabledRoutes,
              [environment.uuid]: postMigrationAction.disabledRoutesUuids
            }
          });
        }
        break;
    }
  }

  /**
   * Check if an environment needs to be migrated depending on its own lastMigration,
   * and settings' old lastMigration param.
   * Returns at which migration id to start, or -1 if no migration is needed
   */
  private getMigrationStartId(environment: Environment): number {
    if (
      environment.lastMigration !== undefined &&
      environment.lastMigration < HighestMigrationId
    ) {
      return environment.lastMigration;
    } else if (
      environment.lastMigration === undefined &&
      HighestMigrationId > this.settingsService.oldLastMigration
    ) {
      return this.settingsService.oldLastMigration;
    }

    return -1;
  }
}
