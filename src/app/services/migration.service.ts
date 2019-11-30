import { Injectable } from '@angular/core';
import { Migrations } from 'src/app/libs/migrations.lib';
import { SettingsService } from 'src/app/services/settings.service';
import { Store } from 'src/app/stores/store';
import { Environment, Environments } from 'src/app/types/environment.type';

@Injectable()
export class MigrationService {
  public readonly latestMigration: number;

  constructor(private settingsService: SettingsService, private store: Store) {
    // get most recent migration
    this.latestMigration = Migrations.reduce((lastMigrationId, migration) => {
      if (migration.id > lastMigrationId) {
        return migration.id;
      }
    }, 0);
  }

  /**
   * Check if each environment needs to be migrated.
   *
   * @param environments - environments to migrate
   */
  public migrateEnvironments(environments: Environments) {
    environments.forEach(environment => {
      const migrationStartId = this.getMigrationStartId(environment);

      if (migrationStartId > -1) {
        Migrations.forEach(migration => {
          if (migration.id > migrationStartId) {
            migration.migrationFunction(environment);
            environment.lastMigration = migration.id;
          }
        });
      }
    });

    return environments;
  }

  /**
   * Get the migration with the highest Id (most recent one)
   */
  public getLatestMigration(): number {
    return Migrations.reduce((lastMigrationId, migration) => {
      if (migration.id > lastMigrationId) {
        return migration.id;
      }
    }, 0);
  }

  /**
   * Check if an environment needs to be migrated depending on its own lastMigration,
   * and settings' old lastMigration param.
   * Returns at which migration id to start, or -1 if no migration is needed
   */
  private getMigrationStartId(environment: Environment): number {
    if (
      environment.lastMigration !== undefined &&
      environment.lastMigration < this.latestMigration
    ) {
      return environment.lastMigration;
    } else if (
      environment.lastMigration === undefined &&
      this.latestMigration > this.settingsService.oldLastMigration
    ) {
      return this.settingsService.oldLastMigration;
    }

    return -1;
  }
}
