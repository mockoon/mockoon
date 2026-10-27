export type AppEnvironment = {
  production: boolean;
  web: boolean;
  ci: boolean;
  remoteConfig: string;
  useFirebaseEmulator: boolean;
  websiteUrl: string;
  defaultApiUrl: string;
};
