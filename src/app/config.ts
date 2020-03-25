import { environment } from 'src/environments/environment';

const tutorialURL = 'https://mockoon.com/tutorial/';

export const Config = {
  feedbackLink: 'https://github.com/mockoon/mockoon/issues',
  githubLatestReleaseUrl:
    'https://api.github.com/repos/mockoon/mockoon/releases/latest',
  githubTagReleaseUrl: 'https://github.com/mockoon/mockoon/releases/tag/v',
  githubAPITagReleaseUrl:
    'https://api.github.com/repos/mockoon/mockoon/releases/tags/v',
  githubBinaryDownloadUrl:
    'https://github.com/mockoon/mockoon/releases/download/',
  wikiLinks: {
    templating: tutorialURL + 'dynamic-response-with-templating/',
    proxy: tutorialURL + 'api-mocking-proxy-mode/',
    cors: tutorialURL + 'automatic-handling-preflight-requests/',
    https: tutorialURL + 'serve-mock-api-tls/',
    headers: tutorialURL + 'define-response-headers/',
    rules: tutorialURL + 'multiple-route-responses/'
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
