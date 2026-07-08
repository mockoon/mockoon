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
  websiteUrl: string;
  defaultApiUrl: string;
  isWeb?: boolean;
}) => {
  const docsUrl = `${options.websiteUrl}docs/latest/`;
  const cloudDocsUrl = `${options.websiteUrl}cloud/docs/`;

  return {
    isWeb: options.isWeb,
    appVersion,
    remoteConfigDefaults: {
      dataRefreshInterval: 300_000 // 5 minutes
    },
    websiteUrl: options.websiteUrl,
    defaultApiUrl: options.defaultApiUrl,
    githubBinaryURL: 'https://github.com/mockoon/mockoon/releases/download/',
    latestReleaseDataURL: `${options.defaultApiUrl}releases/desktop/stable.json`,
    changelogMarkdownURL: `${options.websiteUrl}desktop-changelogs-markdown/`,
    releasePublicURL: `${options.websiteUrl}releases/`,
    docs: {
      adminApi: `${docsUrl}admin-api/overview/`,
      templating: `${docsUrl}templating/overview/`,
      proxy: `${docsUrl}server-configuration/proxy-mode/`,
      cors: `${docsUrl}server-configuration/cors/`,
      https: `${docsUrl}server-configuration/serving-over-tls/`,
      headers: `${docsUrl}response-configuration/response-headers/`,
      rules: `${docsUrl}route-responses/multiple-responses/`,
      hostname: `${docsUrl}server-configuration/listening-hostname/`,
      faq: `${options.websiteUrl}faq/`,
      cloudOverview: `${cloudDocsUrl}about/`,
      cloudDeploy: `${cloudDocsUrl}api-mock-cloud-deployments/`,
      cloudSync: `${cloudDocsUrl}data-synchronization-team-collaboration/`,
      cloudDeployCliPull: `${cloudDocsUrl}api-mock-cloud-deployments/#self-host-with-the-cli`
    },
    // URLs should not be used directly in desktop app (but there is a redirection for the web app in user service). Instead use the flow methods in the user service
    appAuthURL: `${options.websiteUrl}app-auth/`,
    loginURL: `${options.websiteUrl}login/`,
    accountUrl: `${options.websiteUrl}account/subscription/`,
    accountAuthenticationUrl: `${options.websiteUrl}account/access-tokens/`,
    cloudPlansURL: `${options.websiteUrl}cloud/`,
    maxPromptLength: 500,
    defaultMaxLogsPerEnvironment: defaultMaxTransactionLogs,
    maxLogsPerEnvironmentLimit: 1_000,
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
