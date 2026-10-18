import { MessageParams } from 'src/renderer/app/models/messages.model';
import { ToastTypes } from 'src/renderer/app/models/toasts.model';

export type EnvironmentSourceMessageCodes =
  | 'ENVIRONMENT_URL_REFRESH_SUCCESS'
  | 'ENVIRONMENT_URL_REFRESH_ERROR'
  | 'ENVIRONMENT_URL_REFRESH_SKIPPED'
  | 'ENVIRONMENT_EXPORT_NO_CHANGES'
  | 'ENVIRONMENT_EXPORT_MIGRATION_DIFF'
  | 'ENVIRONMENT_EXPORT_ERROR';

export const EnvironmentSourceMessages: Record<
  EnvironmentSourceMessageCodes,
  (messageParams: MessageParams) => {
    message: string;
    log: boolean;
    showToast: true;
    toastType: ToastTypes;
  }
> = {
  ENVIRONMENT_URL_REFRESH_SUCCESS: (messageParams) => ({
    message: `Environment "${messageParams['environmentName']}" has been refreshed from URL`,
    log: true,
    showToast: true,
    toastType: 'success'
  }),
  ENVIRONMENT_URL_REFRESH_ERROR: (messageParams) => ({
    message: `Error while refreshing environment from URL: ${messageParams?.['error']?.['message']}`,
    log: true,
    showToast: true,
    toastType: 'error'
  }),
  ENVIRONMENT_URL_REFRESH_SKIPPED: (messageParams) => ({
    message: `Environment "${messageParams['environmentName']}" has local changes and was not refreshed from URL. Use "Refresh from URL" to update it`,
    log: true,
    showToast: true,
    toastType: 'warning'
  }),
  ENVIRONMENT_EXPORT_NO_CHANGES: (messageParams) => ({
    message: `Environment "${messageParams['environmentName']}" has no changes compared to its source URL`,
    log: false,
    showToast: true,
    toastType: 'warning'
  }),
  ENVIRONMENT_EXPORT_MIGRATION_DIFF: (messageParams) => ({
    message: `Environment "${messageParams['environmentName']}" source file uses an older format version, the exported file will also contain migration changes`,
    log: false,
    showToast: true,
    toastType: 'warning'
  }),
  ENVIRONMENT_EXPORT_ERROR: (messageParams) => ({
    message: `Error while exporting environment: ${messageParams?.['error']?.['message']}`,
    log: true,
    showToast: true,
    toastType: 'error'
  })
};
