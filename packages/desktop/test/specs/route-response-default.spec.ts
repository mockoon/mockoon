import { resolve } from 'path';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import http from '../libs/http';
import menu from '../libs/menu';
import { HttpCall } from '../libs/models';
import routes from '../libs/routes';
import utils from '../libs/utils';

const firstRuleCall: HttpCall = {
  path: '/users/1',
  method: 'GET',
  testedResponse: {
    status: 500
  }
};
const firstRuleCallWithBody: HttpCall = {
  ...firstRuleCall,
  body: { test: 'test' },
  headers: { 'Content-Type': 'application/json' }
};

const secondRuleCall: HttpCall = {
  path: '/users/1',
  method: 'GET',
  testedResponse: {
    status: 200
  }
};

describe('Default route response', () => {
  it('should open the environment', async () => {
    await environments.open('response-rules');
    await environments.start();
  });

  it('should check that first response is the default one, and stays after adding a response', async () => {
    await routes.assertCountRouteResponses(1);
    await routes.openRouteResponseMenu();

    await routes.assertDefaultRouteResponse(1);
    await http.assertCall(firstRuleCall);

    await routes.addRouteResponse();
    await routes.openRouteResponseMenu();
    await routes.assertCountRouteResponses(2);
    await routes.assertDefaultRouteResponse(1);
    await routes.assertDefaultRouteResponse(2, true);
    await utils.waitForAutosave();
    await http.assertCall(firstRuleCall);
  });

  it('should set second route response as default', async () => {
    // route response menu is still open
    await routes.setDefaultRouteResponse(2);
    await routes.assertDefaultRouteResponse(2);
    await routes.assertDefaultRouteResponse(1, true);
    await utils.waitForAutosave();
    await http.assertCall(secondRuleCall);
  });

  it('should still get first response if rule fulfilled', async () => {
    await http.assertCall(firstRuleCallWithBody);
  });

  it('should set first response as default when default is deleted', async () => {
    // route response menu is still open
    await routes.selectRouteResponse(2);
    await routes.removeRouteResponse();
    await routes.openRouteResponseMenu();
    await routes.assertCountRouteResponses(1);
    await routes.assertDefaultRouteResponse(1);
  });

  it('should keep first response as default when response is duplicated', async () => {
    // route response menu is still open
    await routes.duplicateRouteResponse();
    await routes.openRouteResponseMenu();
    await routes.assertCountRouteResponses(2);
    await routes.assertDefaultRouteResponse(1);
    await routes.assertDefaultRouteResponse(2, true);
  });

  it('should make flag as grey if sequential or random responses is selected', async () => {
    await routes.assertDefaultRouteResponseClass(1, 'text-primary');
    await routes.toggleRouteResponseSequential();
    await routes.openRouteResponseMenu();
    await routes.assertDefaultRouteResponseClass(1, 'text-muted');
    await routes.toggleRouteResponseRandom();
    await routes.openRouteResponseMenu();
    await routes.assertDefaultRouteResponseClass(1, 'text-muted');
    await routes.toggleRouteResponseRandom();
    await routes.openRouteResponseMenu();
    await routes.assertDefaultRouteResponseClass(1, 'text-primary');
  });

  it('should set first route response as default when adding a new route', async () => {
    await routes.addHTTPRoute();
    await routes.openRouteResponseMenu();
    await routes.assertCountRouteResponses(1);
    await routes.assertDefaultRouteResponse(1);
  });

  it('should set first route response as default when importing an open api spec', async () => {
    await dialogs.open(
      './test/data/res/import-openapi/samples/petstore-v3.yaml'
    );
    await dialogs.save(resolve('./tmp/storage/petstore-v3.json'));
    await menu.click('MENU_IMPORT_OPENAPI_FILE');
    await browser.pause(500);
    await environments.assertActiveMenuEntryText('Swagger Petstore v3');
    await routes.openRouteResponseMenu();
    await routes.assertCountRouteResponses(2);
    await routes.assertDefaultRouteResponse(1);
    await routes.assertDefaultRouteResponse(2, true);
  });
});
