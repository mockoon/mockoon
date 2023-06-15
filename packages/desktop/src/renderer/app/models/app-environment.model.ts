export type AppEnvironment = {
  production: boolean;
  ci: boolean;
  remoteConfig: string;
  useFirebaseEmulator: boolean;
  websiteURL: string;
  apiURL: string;
};
