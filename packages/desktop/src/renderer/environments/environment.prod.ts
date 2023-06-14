import { AppEnvironment } from 'src/renderer/app/models/app-environment.model';

export const environment: AppEnvironment = {
  production: true,
  remoteConfig: 'prod',
  useFirebaseEmulator: false,
  ci: false,
  websiteURL: 'https://mockoon.com/',
  apiURL: 'https://api.mockoon.com/'
};
