import { BodyTypes } from '@mockoon/commons';
import { promises as fs } from 'fs';
import environments from '../libs/environments';
import headersUtils from '../libs/headers-utils';
import http from '../libs/http';
import { HttpCall } from '../libs/models';
import navigation from '../libs/navigation';
import routes from '../libs/routes';
import utils from '../libs/utils';

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

const getFileNoMime: HttpCall = {
  description: 'Call GET file, with no mime type',
  path: '/file-nomime',
  method: 'GET',
  testedResponse: {
    status: 200,
    headers: {
      'content-type': 'text/plain'
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

describe('Headers', () => {
  describe('Route and environment headers', () => {
    it('should open the environment', async () => {
      await environments.open('headers');
    });

    it('should add headers on route', async () => {
      await routes.assertContentType('application/json');

      await routes.switchTab('HEADERS');

      await navigation.assertHeaderValue('ENV_HEADERS', 'Headers\n1');
      await utils.assertElementText(routes.headersTab, 'Headers\n1');

      await headersUtils.add('route-response-headers', {
        key: 'route-header',
        value: 'route-header'
      });

      await headersUtils.add('route-response-headers', {
        key: 'custom-header',
        value: 'routevalue'
      });
      await utils.assertElementText(routes.headersTab, 'Headers\n3');
    });

    it('should add headers on environment', async () => {
      await navigation.switchView('ENV_HEADERS');

      await headersUtils.add('environment-headers', {
        key: 'global-header',
        value: 'global-header'
      });

      await headersUtils.add('environment-headers', {
        key: 'custom-header',
        value: 'envvalue'
      });
      await navigation.assertHeaderValue('ENV_HEADERS', 'Headers 3');
    });

    it('should verify the header tab counter', async () => {
      await navigation.assertHeaderValue('ENV_HEADERS', 'Headers 3');
    });

    it('should call /headers, route headers should override global headers', async () => {
      await environments.start();
      await http.assertCallWithPort(getHeaders, 3000);
    });

    it('should call /donotexists should return a 404 with global headers', async () => {
      await http.assertCallWithPort(getDoNotExists, 3000);
    });
  });

  describe('Duplicated Set-Cookie header', () => {
    it('should add duplicated Set-Cookie headers on route', async () => {
      await navigation.switchView('ENV_ROUTES');
      await routes.switchTab('HEADERS');
      await browser.pause(50);

      await headersUtils.add('route-response-headers', {
        key: 'Set-Cookie',
        value: 'routecookie1=routecookie1value'
      });

      await headersUtils.add('route-response-headers', {
        key: 'Set-Cookie',
        value: 'routecookie2=routecookie2value'
      });
      await browser.pause(100);
    });

    it('should add duplicated Set-Cookie headers on environment', async () => {
      await navigation.switchView('ENV_HEADERS');

      await headersUtils.add('environment-headers', {
        key: 'Set-Cookie',
        value: 'envcookie1=envcookie1value'
      });

      await headersUtils.add('environment-headers', {
        key: 'Set-Cookie',
        value: 'envcookie2=envcookie2value'
      });
    });

    it('should call /headers, we should get an array of Set-Cookie headers', async () => {
      await utils.waitForAutosave();
      await http.assertCallWithPort(getDuplicatedSetCookieHeaders, 3000);
    });
  });

  describe('File headers', () => {
    it('should call /file should get XML content-type from route header', async () => {
      await fs.copyFile('./test/data/res/test.pdf', './tmp/storage/test.pdf');

      await navigation.switchView('ENV_ROUTES');
      await routes.select(2);
      await routes.selectBodyType(BodyTypes.FILE);

      await routes.assertContentType('application/xml');
      await http.assertCallWithPort(getFile, 3000);
    });

    it('should call /file-noheader should get PDF content-type from file mime type', async () => {
      await routes.select(3);
      await routes.selectBodyType(BodyTypes.FILE);
      await routes.assertContentType('application/pdf');
      await http.assertCallWithPort(getFileNoHeader, 3000);
    });

    it('should call /file-nomime should revert to the environment content type', async () => {
      await fs.copyFile('./test/data/res/filenoext', './tmp/storage/filenoext');
      await routes.select(4);
      await routes.selectBodyType(BodyTypes.FILE);
      await routes.assertContentType('text/plain');
      await http.assertCallWithPort(getFileNoMime, 3000);
    });
  });

  describe('CORS headers', () => {
    it('should Call OPTIONS /headers and get the CORS headers', async () => {
      await http.assertCallWithPort(getCORSHeaders, 3000);
    });

    it('should override CORS headers on the environment', async () => {
      await navigation.switchView('ENV_HEADERS');

      await headersUtils.add('environment-headers', {
        key: 'Access-Control-Allow-Origin',
        value: 'https://mockoon.com'
      });

      await utils.waitForAutosave();

      await http.assertCallWithPort(getOverriddenCORSHeaders, 3000);
    });
  });

  describe('Add CORS headers', () => {
    it('should remove all headers and click on "Add CORS headers" button and check headers count', async () => {
      await navigation.switchView('ENV_HEADERS');
      await headersUtils.remove('environment-headers', 1);
      await headersUtils.remove('environment-headers', 1);
      await headersUtils.remove('environment-headers', 1);
      await headersUtils.remove('environment-headers', 1);
      await headersUtils.remove('environment-headers', 1);
      await headersUtils.remove('environment-headers', 1);
      await headersUtils.assertCount('environment-headers', 0);
      await headersUtils.clickCORSButton('environment-headers');

      await headersUtils.assertCount('environment-headers', 3);
      await headersUtils.assertHeadersValues('environment-headers', {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods':
          'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Origin, Accept, Authorization, Content-Length, X-Requested-With'
      });
    });
  });

  describe('Headers typeahead', () => {
    const typeaheadEntrySelector = 'ngb-typeahead-window button:first-of-type';

    const testCases = [
      {
        description: 'should use the typeahead in the route headers',
        headers: 'route-response-headers',
        preHook: async () => {
          await navigation.switchView('ENV_ROUTES');
          await routes.switchTab('HEADERS');
        }
      },
      {
        description: 'should use the typeahead in the environment headers',
        headers: 'environment-headers',
        preHook: async () => {
          await navigation.switchView('ENV_HEADERS');
        }
      },
      {
        description: 'should use the typeahead in the proxy request headers',
        headers: 'env-proxy-req-headers',
        preHook: async () => {
          await navigation.switchView('ENV_PROXY');
        }
      },
      {
        description: 'should use the typeahead in the proxy response headers',
        headers: 'env-proxy-res-headers',
        preHook: async () => {
          await navigation.switchView('ENV_PROXY');
        }
      }
    ];

    testCases.forEach((testCase) => {
      const headersSelector = `app-headers-list#${testCase.headers}`;
      const headerKeySelector = `${headersSelector} .headers-list .header-item:last-of-type input:nth-of-type(1)`;

      it(testCase.description, async () => {
        await testCase.preHook();
        await $(`${headersSelector} button:first-of-type`).click();
        await utils.setElementValue($(headerKeySelector), 'typ');
        await $(typeaheadEntrySelector).waitForExist();
        await $(typeaheadEntrySelector).click();
        const headerName = await $(headerKeySelector).getValue();
        expect(headerName).toEqual('Content-Type');
      });
    });
  });
});
