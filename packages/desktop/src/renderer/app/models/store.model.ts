import { Environments } from '@mockoon/commons';
import {
  CallbackSpecTabNameType,
  CallbackTabsNameType
} from 'src/renderer/app/models/callback.model';
import { DataSubject } from 'src/renderer/app/models/data.model';
import {
  ActiveEnvironmentsLogUUIDs,
  EnvironmentLogs
} from 'src/renderer/app/models/environment-logs.model';
import { Toast } from 'src/renderer/app/models/toasts.model';
import { User } from 'src/renderer/app/models/user.model';
import { Settings } from 'src/shared/models/settings.model';

export type ViewsNameType =
  | 'ENV_ROUTES'
  | 'ENV_DATABUCKETS'
  | 'ENV_HEADERS'
  | 'ENV_LOGS'
  | 'ENV_PROXY'
  | 'ENV_SETTINGS'
  | 'ENV_CALLBACKS';

export type TabsNameType =
  | 'RESPONSE'
  | 'HEADERS'
  | 'RULES'
  | 'SETTINGS'
  | 'CALLBACKS';

export type CallbackSettings = {
  activeTab: CallbackTabsNameType;
  activeSpecTab: CallbackSpecTabNameType;
};

export type EnvironmentLogsTabsNameType = 'REQUEST' | 'RESPONSE';

export type TemplatesTabsName = 'LIST' | 'GENERATE';

export type EnvironmentStatus = {
  running: boolean;
  needRestart: boolean;
};

export type EnvironmentStatusProperties = {
  [T in keyof EnvironmentStatus]?: EnvironmentStatus[T];
};

export type EnvironmentsStatuses = { [key: string]: EnvironmentStatus };

export type DuplicatedRoutesTypes = { [key: string]: Set<string> };

export type UIState = {
  closing: boolean;
  saving: boolean;
};

export type UIStateProperties = { [T in keyof UIState]?: UIState[T] };

export type DuplicateEntityToAnotherEnvironment = {
  moving: boolean;
  subject?: Omit<DataSubject, 'environment'>;
  subjectUUID?: string;
  targetEnvironmentUUID?: string;
};

export type StoreType = {
  activeTab: TabsNameType;
  activeView: ViewsNameType;
  activeEnvironmentLogsTab: EnvironmentLogsTabsNameType;
  activeTemplatesTab: TemplatesTabsName;
  activeEnvironmentUUID: string;
  activeRouteUUID: string;
  activeRouteResponseUUID: string;
  activeCallbackUUID: string;
  activeDatabucketUUID: string;
  environments: Environments;
  environmentsStatus: EnvironmentsStatuses;
  bodyEditorConfig: any;
  // duplicated routes per environment
  duplicatedRoutes: DuplicatedRoutesTypes;
  environmentsLogs: EnvironmentLogs;
  // the active log UUID per environment
  activeEnvironmentLogsUUID: ActiveEnvironmentsLogUUIDs;
  toasts: Toast[];
  uiState: UIState;
  settings: Settings;
  duplicateEntityToAnotherEnvironment: DuplicateEntityToAnotherEnvironment;
  filters: {
    routes: string;
    databuckets: string;
    templates: string;
    callbacks: string;
  };
  user: User;
  callbackSettings: CallbackSettings;
};
