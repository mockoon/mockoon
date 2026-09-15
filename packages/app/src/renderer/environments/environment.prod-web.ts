import { AppEnvironment } from 'src/renderer/app/models/app-environment.model';

export const environment: AppEnvironment = {
  production: true,
  web: true,
  remoteConfig: 'prod',
  useFirebaseEmulator: false,
  ci: false,
  websiteUrl: 'https://mockoon.com/',
  defaultApiUrl: 'https://api.mockoon.com/'
};
