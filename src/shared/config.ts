const appVersion: string = require('../../package.json').version;
const websiteURL = 'https://mockoon.com/';
const docsURL = `${websiteURL}docs/latest/`;

export const Config = {
  appVersion,
  telemetry: {
    sessionDuration: 3_600_000, // 1h
    functionName: 'telemetry'
  },
  githubTagReleaseUrl: 'https://github.com/mockoon/mockoon/releases/tag/v',
  githubAPITagReleaseUrl:
    'https://api.github.com/repos/mockoon/mockoon/releases/tags/v',
  docs: {
    templating: docsURL + 'templating/overview/',
    proxy: docsURL + 'proxy-mode/',
    cors: docsURL + 'cors/',
    https: docsURL + 'serving-over-tls/',
    headers: docsURL + 'response-headers/',
    rules: docsURL + 'route-responses/multiple-responses/',
    hostname: docsURL + 'listening-hostname/',
    faq: websiteURL + 'faq/'
  },
  defaultMaxLogsPerEnvironment: 50,
  defaultEnvironmentMenuSize: 100,
  defaultRouteMenuSize: 200,
  defaultLogsMenuSize: 150,
  storageSaveDelay: 1000, // ms
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
