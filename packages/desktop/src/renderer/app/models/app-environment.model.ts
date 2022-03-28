export type AppEnvironment = {
  production: boolean;
  ci: boolean;
  analyticsID: string;
  remoteConfig: string;
  useFirebaseEmulator: boolean;
};
