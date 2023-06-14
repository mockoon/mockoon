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
}) => {
  const docsURL = `${options.websiteURL}docs/latest/`;

  return {
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
      proxy: docsURL + 'proxy-mode/',
      cors: docsURL + 'cors/',
      https: docsURL + 'serving-over-tls/',
      headers: docsURL + 'response-headers/',
      rules: docsURL + 'route-responses/multiple-responses/',
      hostname: docsURL + 'listening-hostname/',
      faq: options.websiteURL + 'faq/'
    },
    loginURL: `${options.websiteURL}login/?inapp=true`,
    signupURL: `${options.websiteURL}signup/?inapp=true`,
    accountURL: `${options.websiteURL}account/subscription/`,
    proPlansURL: `${options.websiteURL}pro/`,
    maxTemplatePromptLength: 500,
    defaultMaxLogsPerEnvironment: 50,
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
    }
  };
};
