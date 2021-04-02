import { environment } from 'src/renderer/environments/environment';

const appVersion: string = require('../../../package.json').version;
const docsURL = 'https://mockoon.com/docs/latest/';

export const Config = {
  appVersion,
  githubTagReleaseUrl: 'https://github.com/mockoon/mockoon/releases/tag/v',
  githubAPITagReleaseUrl:
    'https://api.github.com/repos/mockoon/mockoon/releases/tags/v',
  docs: {
    templating: docsURL + 'templating/',
    proxy: docsURL + 'proxy-mode/',
    cors: docsURL + 'cors/',
    https: docsURL + 'https/',
    headers: docsURL + 'response-headers/',
    rules: docsURL + 'multiple-responses/'
  },
  maxLogsPerEnvironment: 50,
  firebaseConfig: {
    apiKey: 'AIzaSyCIkzTtimLebXjf-gfCQ6iwCVFsYRhCRvs',
    authDomain: 'mockoon-ba3e2.firebaseapp.com',
    databaseURL: 'https://mockoon-ba3e2.firebaseio.com',
    projectId: 'mockoon-ba3e2',
    storageBucket: 'mockoon-ba3e2.appspot.com',
    messagingSenderId: '902702764744',
    appId: '1:902702764744:web:599e8dc8d6a1ef6542cbfd',
    measurementId: environment.firebaseMeasurementId
  }
};
