import { AppEnvironment } from 'src/renderer/app/models/app-environment.model';

export const environment: AppEnvironment = {
  production: false,
  web: true,
  remoteConfig: 'dev',
  useFirebaseEmulator: true,
  ci: false,
  websiteURL: 'http://localhost:3000/',
  apiURL: 'http://localhost:5003/'
};
