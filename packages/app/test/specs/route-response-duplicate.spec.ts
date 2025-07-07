import environments from '../libs/environments';
import headersUtils from '../libs/headers-utils';
import routes from '../libs/routes';
import utils from '../libs/utils';

describe('Duplicate a route response', () => {
  it('should open the environment', async () => {
    await environments.open('basic-data');
  });

  it('should setup and duplicate first route response', async () => {
    await routes.assertCountRouteResponses(1);
    await routes.switchTab('RULES');
    await routes.addResponseRule({
      target: 'body',
      modifier: 'test',
      value: 'test',
      operator: 'equals',
      invert: false
    });
    await routes.duplicateRouteResponse();
    await routes.assertCountRouteResponses(2);
  });

  it('should verify duplicated route characteristics', async () => {
    await routes.assertRouteResponseLabel('Response 1 (copy)');
    await routes.assertRouteResponseStatusCode('200 - OK');
    await routes.switchTab('HEADERS');

    await headersUtils.assertCount('route-response-headers', 1);

    await headersUtils.assertHeadersValues('route-response-headers', {
      'Content-Type': 'application/json'
    });
    await routes.switchTab('RULES');
  });

  it('should verify duplicated route response rules', async () => {
    await routes.assertRulesCount(1);

    await utils.assertDropdownValue('target', 'Body');
    await utils.assertElementValue(
      $(
        'app-route-response-rules .rule-item input[formcontrolname="modifier"]'
      ),
      'test'
    );
    await utils.assertElementValue(
      $('app-route-response-rules .rule-item input[formcontrolname="value"]'),
      'test'
    );
  });
});
