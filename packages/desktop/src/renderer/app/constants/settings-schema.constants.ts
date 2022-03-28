import * as Joi from 'joi';
import { PreMigrationSettings } from 'src/renderer/app/models/settings.model';
import { Config } from 'src/shared/config';
import {
  EnvironmentDescriptor,
  Settings
} from 'src/shared/models/settings.model';

export const SettingsDefault: Settings = {
  welcomeShown: false,
  analytics: true,
  bannerDismissed: [],
  logSizeLimit: 10000,
  maxLogsPerEnvironment: Config.defaultMaxLogsPerEnvironment,
  truncateRouteName: true,
  environmentMenuSize: Config.defaultEnvironmentMenuSize,
  routeMenuSize: Config.defaultRouteMenuSize,
  logsMenuSize: Config.defaultLogsMenuSize,
  fakerLocale: 'en',
  fakerSeed: null,
  lastChangelog: Config.appVersion,
  environments: [],
  enableTelemetry: true,
  storagePrettyPrint: true
};

export const SettingsSchema = Joi.object<Settings & PreMigrationSettings, true>(
  {
    welcomeShown: Joi.boolean()
      .failover(SettingsDefault.welcomeShown)
      .required(),
    analytics: Joi.boolean().failover(SettingsDefault.analytics).required(),
    bannerDismissed: Joi.array()
      .items(Joi.string(), Joi.any().strip())
      .failover(SettingsDefault.bannerDismissed)
      .required(),
    logSizeLimit: Joi.number()
      .min(1)
      .failover(SettingsDefault.logSizeLimit)
      .required(),
    maxLogsPerEnvironment: Joi.number()
      .min(1)
      .failover(SettingsDefault.maxLogsPerEnvironment)
      .required(),
    truncateRouteName: Joi.boolean()
      .failover(SettingsDefault.truncateRouteName)
      .required(),
    environmentMenuSize: Joi.number()
      .min(Config.defaultEnvironmentMenuSize)
      .failover(SettingsDefault.environmentMenuSize)
      .required(),
    routeMenuSize: Joi.number()
      .min(Config.defaultRouteMenuSize)
      .failover(SettingsDefault.routeMenuSize)
      .required(),
    logsMenuSize: Joi.number()
      .min(Config.defaultLogsMenuSize)
      .failover(SettingsDefault.logsMenuSize)
      .required(),
    fakerLocale: Joi.string().failover(SettingsDefault.fakerLocale).required(),
    fakerSeed: Joi.number()
      .allow(null)
      .failover(SettingsDefault.fakerSeed)
      .required(),
    lastChangelog: Joi.string()
      .failover(SettingsDefault.lastChangelog)
      .required(),
    environments: Joi.array()
      .items(
        Joi.object<EnvironmentDescriptor, true>({
          uuid: Joi.string().uuid().required(),
          path: Joi.string().required()
        }),
        Joi.any().strip()
      )
      .failover(SettingsDefault.environments)
      .required(),
    lastMigration: Joi.number().strip(),
    enableTelemetry: Joi.boolean()
      .failover(SettingsDefault.enableTelemetry)
      .required(),
    storagePrettyPrint: Joi.boolean()
      .failover(SettingsDefault.storagePrettyPrint)
      .required()
  }
)
  .failover(SettingsDefault)
  .default(SettingsDefault)
  .options({ stripUnknown: true });
