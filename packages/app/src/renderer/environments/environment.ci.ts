import { AppEnvironment } from 'src/renderer/app/models/app-environment.model';

export const environment: AppEnvironment = {
  production: false,
  web: false,
  remoteConfig: 'dev',
  useFirebaseEmulator: true,
  ci: true,
  websiteUrl: 'http://localhost:3000/',
  defaultApiUrl: 'http://localhost:5003/'
};
