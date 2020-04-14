import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { Logger } from 'src/app/classes/logger';
import { HighestMigrationId, Migrations } from 'src/app/libs/migrations.lib';
import { SettingsService } from 'src/app/services/settings.service';
import { Store } from 'src/app/stores/store';
import { Environment, Environments } from 'src/app/types/environment.type';

@Injectable({ providedIn: 'root' })
export class MigrationService {
  private logger = new Logger('[SERVICE][MIGRATION]');

  constructor(private settingsService: SettingsService, private store: Store) {}

  /**
   * Check if each environment needs to be migrated.
   *
   * @param environments - environments to migrate
   */
  public migrateEnvironments(
    environments: Environments
  ): Observable<Environments> {
    // migration depends on settings being ready
    return this.store.select('settings').pipe(
      first((settings) => !!settings),
      map((s) => {
        environments.forEach((environment) => {
          this.migrateEnvironment(environment);
        });

        return environments;
      })
    );
  }

  /**
   * Migrate one environment.
   * Will automatically check the last migration done on the environment and apply the most recent
   */
  private migrateEnvironment(environment: Environment) {
    const migrationStartId = this.getMigrationStartId(environment);

    if (migrationStartId > -1) {
      this.logger.info(
        `Migrating environment ${environment.uuid} starting at ${migrationStartId}`
      );
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
