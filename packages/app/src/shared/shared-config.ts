import { defaultMaxTransactionLogs } from '@mockoon/commons';

const appVersion: string = require('../../package.json').version;

/**
 * Share config between main and renderer processes
 * Shouldn't be imported directly, use each Config file instead
 *
 * @param options
 * @returns
 */
export const SharedConfig = (options: {
  websiteURL: string;
  apiURL: string;
  isWeb?: boolean;
}) => {
  const docsURL = `${options.websiteURL}docs/latest/`;

  return {
    isWeb: options.isWeb,
    appVersion,
    telemetry: {
      sessionDuration: 3_600_000 // 1h
    },
    websiteURL: options.websiteURL,
    apiURL: options.apiURL,
    githubBinaryURL: 'https://github.com/mockoon/mockoon/releases/download/',
    latestReleaseDataURL: `${options.apiURL}releases/desktop/stable.json`,
    changelogMarkdownURL: `${options.websiteURL}desktop-changelogs-markdown/`,
    releasePublicURL: `${options.websiteURL}releases/`,
    docs: {
      templating: docsURL + 'templating/overview/',
      proxy: docsURL + 'server-configuration/proxy-mode/',
      cors: docsURL + 'server-configuration/cors/',
      https: docsURL + 'server-configuration/serving-over-tls/',
      headers: docsURL + 'response-configuration/response-headers/',
      rules: docsURL + 'route-responses/multiple-responses/',
      hostname: docsURL + 'server-configuration/listening-hostname/',
      faq: options.websiteURL + 'faq/',
      cloudOverview: docsURL + 'mockoon-cloud/overview/',
      cloudSync:
        docsURL + 'mockoon-cloud/data-synchronization-team-collaboration/',
      cloudSyncOffline:
        docsURL +
        'mockoon-cloud/data-synchronization-team-collaboration/#offline-editing'
    },
    // URLs should not be used directly in desktop app (but there is a redirection for the web app in user service). Instead use the flow methods in the user service
    appAuthURL: `${options.websiteURL}app-auth/`,
    loginURL: `${options.websiteURL}login/`,
    accountUrl: `${options.websiteURL}account/subscription/`,
    cloudPlansURL: `${options.websiteURL}cloud/`,
    maxPromptLength: 500,
    defaultMaxLogsPerEnvironment: defaultMaxTransactionLogs,
    defaultMainMenuSize: 100,
    defaultSecondaryMenuSize: 200,
    storageSaveDelay: 1000, // ms
    fileReWatchDelay: 3000, // ms
    firebaseConfig: {
      apiKey: 'AIzaSyCIkzTtimLebXjf-gfCQ6iwCVFsYRhCRvs',
      authDomain: 'mockoon-ba3e2.firebaseapp.com',
      databaseURL: 'https://mockoon-ba3e2.firebaseio.com',
      projectId: 'mockoon-ba3e2',
      storageBucket: 'mockoon-ba3e2.appspot.com',
      messagingSenderId: '902702764744',
      appId: '1:902702764744:web:599e8dc8d6a1ef6542cbfd'
    },
    recaptchaSiteKey: '6LfhRCErAAAAACwFRV5bcqMtNylLhp764ZWXJB90'
  };
};
