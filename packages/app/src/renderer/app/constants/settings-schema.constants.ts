import { defaultEnvironmentVariablesPrefix } from '@mockoon/commons';
import * as Joi from 'joi';
import { Config } from 'src/renderer/config';
import {
  EnvironmentDescriptor,
  FileWatcherOptions,
  RecentLocalEnvironment,
  Settings
} from 'src/shared/models/settings.model';

export const SettingsDefault: Settings = {
  welcomeShown: false,
  maxLogsPerEnvironment: Config.defaultMaxLogsPerEnvironment,
  truncateRouteName: true,
  mainMenuSize: Config.defaultMainMenuSize,
  secondaryMenuSize: Config.defaultSecondaryMenuSize,
  fakerLocale: 'en',
  fakerSeed: null,
  lastChangelog: Config.appVersion,
  environments: [],
  disabledRoutes: {},
  collapsedFolders: {},
  enableTelemetry: true,
  storagePrettyPrint: true,
  fileWatcherEnabled: FileWatcherOptions.DISABLED,
  dialogWorkingDir: '',
  startEnvironmentsOnLoad: false,
  logTransactions: false,
  environmentsCategoriesOrder: ['local', 'cloud'],
  environmentsCategoriesCollapsed: {
    local: false,
    cloud: false
  },
  envVarsPrefix: defaultEnvironmentVariablesPrefix,
  activeEnvironmentUuid: null,
  enableRandomLatency: false,
  recentLocalEnvironments: []
};

export const SettingsSchema = Joi.object<Settings, true>({
  welcomeShown: Joi.boolean().failover(SettingsDefault.welcomeShown).required(),
  maxLogsPerEnvironment: Joi.number()
    .min(1)
    .failover(SettingsDefault.maxLogsPerEnvironment)
    .required(),
  truncateRouteName: Joi.boolean()
    .failover(SettingsDefault.truncateRouteName)
    .required(),
  mainMenuSize: Joi.number()
    .min(Config.defaultMainMenuSize)
    .failover(SettingsDefault.mainMenuSize)
    .required(),
  secondaryMenuSize: Joi.number()
    .min(Config.defaultSecondaryMenuSize)
    .failover(SettingsDefault.secondaryMenuSize)
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
        path: Joi.string().required(),
        cloud: Joi.boolean().failover(false).required(),
        lastServerHash: Joi.string().allow(null).failover(null).required()
      }),
      Joi.any().strip()
    )
    .failover(SettingsDefault.environments)
    .required(),
  disabledRoutes: Joi.object<Settings['disabledRoutes']>()
    .pattern(
      Joi.string(),
      Joi.array().items(Joi.string(), Joi.any().strip()).failover([])
    )
    .required()
    .failover(SettingsDefault.disabledRoutes),
  collapsedFolders: Joi.object<Settings['collapsedFolders']>()
    .pattern(
      Joi.string(),
      Joi.array().items(Joi.string(), Joi.any().strip()).failover([])
    )
    .required()
    .failover(SettingsDefault.collapsedFolders),
  enableTelemetry: Joi.boolean()
    .failover(SettingsDefault.enableTelemetry)
    .required(),
  storagePrettyPrint: Joi.boolean()
    .failover(SettingsDefault.storagePrettyPrint)
    .required(),
  fileWatcherEnabled: Joi.string()
    .valid(
      FileWatcherOptions.DISABLED,
      FileWatcherOptions.PROMPT,
      FileWatcherOptions.AUTO
    )
    .failover(SettingsDefault.fileWatcherEnabled)
    .required(),
  dialogWorkingDir: Joi.string()
    .failover(SettingsDefault.dialogWorkingDir)
    .required(),
  startEnvironmentsOnLoad: Joi.boolean()
    .failover(SettingsDefault.startEnvironmentsOnLoad)
    .required(),
  logTransactions: Joi.boolean()
    .failover(SettingsDefault.logTransactions)
    .required(),
  environmentsCategoriesOrder: Joi.array()
    .items(Joi.string().valid('cloud', 'local'), Joi.any().strip())
    .failover(SettingsDefault.environmentsCategoriesOrder)
    .required(),
  environmentsCategoriesCollapsed: Joi.object<
    Settings['environmentsCategoriesCollapsed'],
    true
  >({
    cloud: Joi.boolean().required(),
    local: Joi.boolean().required()
  })
    .failover(SettingsDefault.environmentsCategoriesCollapsed)
    .required(),
  envVarsPrefix: Joi.string()
    .allow('')
    .failover(SettingsDefault.envVarsPrefix)
    .required(),
  activeEnvironmentUuid: Joi.string()
    .uuid()
    .allow(null)
    .failover(SettingsDefault.activeEnvironmentUuid)
    .required(),
  enableRandomLatency: Joi.boolean()
    .failover(SettingsDefault.enableRandomLatency)
    .required(),
  recentLocalEnvironments: Joi.array()
    .items(
      Joi.object<RecentLocalEnvironment, true>({
        name: Joi.string().required(),
        path: Joi.string().required()
      }),
      Joi.any().strip()
    )
    .failover(SettingsDefault.recentLocalEnvironments)
    .required()
})
  .failover(SettingsDefault)
  .default(SettingsDefault)
  .options({ stripUnknown: true });
