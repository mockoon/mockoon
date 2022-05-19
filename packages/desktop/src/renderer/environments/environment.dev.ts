import { AppEnvironment } from 'src/renderer/app/models/app-environment.model';

export const environment: AppEnvironment = {
  production: false,
  remoteConfig: 'dev',
  useFirebaseEmulator: true,
  ci: false
};
