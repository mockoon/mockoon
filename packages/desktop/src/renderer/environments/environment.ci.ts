import { AppEnvironment } from 'src/renderer/app/models/app-environment.model';

export const environment: AppEnvironment = {
  production: false,
  remoteConfig: 'dev',
  useFirebaseEmulator: true,
  ci: true,
  websiteURL: 'https://mockoon.com/',
  apiURL: 'https://api.mockoon.com/'
};
