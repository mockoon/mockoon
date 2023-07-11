import { Injectable } from '@angular/core';
import { Environment, HighestMigrationId, Migrations } from '@mockoon/commons';
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
          migration.migrationFunction(environment);
          environment.lastMigration = migration.id;
        }
      });
    }

    return environment;
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
