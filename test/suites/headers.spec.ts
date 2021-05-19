import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

const getHeaders: HttpCall = {
  description: 'Call GET headers',
  path: '/headers',
  method: 'GET',
  testedResponse: {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'route-header': 'route-header',
      'custom-header': 'routevalue',
      'global-header': 'global-header'
    }
  }
};

const getDuplicatedSetCookieHeaders: HttpCall = {
  description: 'Call GET headers',
  path: '/headers',
  method: 'GET',
  testedResponse: {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'set-cookie': [
        'envcookie1=envcookie1value',
        'envcookie2=envcookie2value',
        'routecookie1=routecookie1value',
        'routecookie2=routecookie2value'
      ]
    }
  }
};

const getDoNotExists: HttpCall = {
  description: 'Call GET donotexists',
  path: '/donotexists',
  method: 'GET',
  testedResponse: {
    status: 404,
    headers: {
      'global-header': 'global-header',
      'custom-header': 'envvalue'
    }
  }
};

const getFile: HttpCall = {
  description: 'Call GET file, with no route header',
  path: '/file',
  method: 'GET',
  testedResponse: {
    status: 200,
    headers: {
      'content-type': 'application/xml'
    }
  }
};

const getFileNoHeader: HttpCall = {
  description: 'Call GET file, with no route header',
  path: '/file-noheader',
  method: 'GET',
  testedResponse: {
    status: 200,
    headers: {
      'content-type': 'application/pdf'
    }
  }
};

const getCORSHeaders: HttpCall = {
  description: 'Call OPTIONS headers',
  path: '/headers',
  method: 'OPTIONS',
  testedResponse: {
    status: 200,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
      'access-control-allow-headers':
        'Content-Type, Origin, Accept, Authorization, Content-Length, X-Requested-With'
    }
  }
};

const getOverriddenCORSHeaders: HttpCall = {
  description: 'Call OPTIONS headers',
  path: '/headers',
  method: 'OPTIONS',
  testedResponse: {
    status: 200,
    headers: {
      'access-control-allow-origin': 'https://mockoon.com',
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
      'access-control-allow-headers':
        'Content-Type, Origin, Accept, Authorization, Content-Length, X-Requested-With'
    }
  }
};

describe('Route and environment headers', () => {
  const tests = new Tests('headers');

  it('Add headers on route', async () => {
    await tests.helpers.switchTab('HEADERS');

    await tests.helpers.addHeader('route-response-headers', {
      key: 'route-header',
      value: 'route-header'
    });

    await tests.helpers.addHeader('route-response-headers', {
      key: 'custom-header',
      value: 'routevalue'
    });
  });

  it('Add headers on environment', async () => {
    await tests.helpers.switchViewInHeader('ENV_SETTINGS');

    await tests.helpers.addHeader('environment-headers', {
      key: 'global-header',
      value: 'global-header'
    });

    await tests.helpers.addHeader('environment-headers', {
      key: 'custom-header',
      value: 'envvalue'
    });
  });

  it('Call /headers, route headers should override global headers', async () => {
    await tests.helpers.startEnvironment();
    await tests.helpers.httpCallAsserterWithPort(getHeaders, 3000);
  });

  it('Call /donotexists should return a 404 with global headers', async () => {
    await tests.helpers.httpCallAsserterWithPort(getDoNotExists, 3000);
  });
});

describe('Duplicated Set-Cookie header', () => {
  const tests = new Tests('headers');

  it('Add duplicated Set-Cookie headers on route', async () => {
    await tests.helpers.switchTab('HEADERS');

    await tests.helpers.addHeader('route-response-headers', {
      key: 'Set-Cookie',
      value: 'routecookie1=routecookie1value'
    });

    await tests.helpers.addHeader('route-response-headers', {
      key: 'Set-Cookie',
      value: 'routecookie2=routecookie2value'
    });
  });

  it('Add duplicated Set-Cookie headers on environment', async () => {
    await tests.helpers.switchViewInHeader('ENV_SETTINGS');

    await tests.helpers.addHeader('environment-headers', {
      key: 'Set-Cookie',
      value: 'envcookie1=envcookie1value'
    });

    await tests.helpers.addHeader('environment-headers', {
      key: 'Set-Cookie',
      value: 'envcookie2=envcookie2value'
    });
  });

  it('Call /headers, we should get an array of Set-Cookie headers', async () => {
    await tests.helpers.startEnvironment();
    await tests.helpers.httpCallAsserterWithPort(
      getDuplicatedSetCookieHeaders,
      3000
    );
  });
});

describe('File headers', () => {
  const tests = new Tests('headers');

  it('Call /file should get XML content-type from route header', async () => {
    await tests.helpers.startEnvironment();

    await tests.helpers.httpCallAsserterWithPort(getFile, 3000);
  });

  it('Call /file-noheader should get PDF content-type from file mime type', async () => {
    await tests.helpers.httpCallAsserterWithPort(getFileNoHeader, 3000);
  });
});

describe('CORS headers', () => {
  const tests = new Tests('headers');

  it('should Call OPTIONS /headers and get the CORS headers', async () => {
    await tests.helpers.startEnvironment();
    await tests.helpers.httpCallAsserterWithPort(getCORSHeaders, 3000);
  });

  it('should override CORS headers on the environment', async () => {
    await tests.helpers.switchViewInHeader('ENV_SETTINGS');

    await tests.helpers.addHeader('environment-headers', {
      key: 'Access-Control-Allow-Origin',
      value: 'https://mockoon.com'
    });
    await tests.helpers.httpCallAsserterWithPort(
      getOverriddenCORSHeaders,
      3000
    );
  });
});
