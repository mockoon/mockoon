import { expect } from 'chai';
import { Tests } from 'test/lib/tests';

describe('Duplicate a route response', () => {
  const tests = new Tests('basic-data');

  it('Duplicate first route response', async () => {
    await tests.helpers.countRouteResponses(1);
    await tests.helpers.duplicateRouteResponse();
    await tests.helpers.countRouteResponses(2);
  });

  it('Verify duplicated route response has the label with the "(copy)" tag', async () => {
    const label = 'Test';
    const labelToCompare = 'Test (copy)';
    const routeResponseLabelInputSelector =
      '.input-group .form-control[formcontrolname="label"]';

    await tests.helpers.selectRouteResponse(1);
    await tests.helpers.removeRouteResponse();
    await tests.helpers.setElementValue(routeResponseLabelInputSelector, label);
    await tests.helpers.duplicateRouteResponse();

    await tests.helpers.assertElementValue(
      routeResponseLabelInputSelector,
      labelToCompare
    );
  });

  it('Verify duplicated route response has the same status code with the original response', async () => {
    const routeResponseStatusCodeSelectSelector =
      '.input-group .custom-select[formcontrolname="statusCode"]';
    const statusCode = '22: 400';

    await tests.helpers.selectRouteResponse(1);
    await tests.helpers.removeRouteResponse();
    await tests.helpers.selectByAttribute(
      routeResponseStatusCodeSelectSelector,
      'value',
      statusCode
    );
    await tests.helpers.duplicateRouteResponse();

    await tests.helpers.assertElementValue(
      routeResponseStatusCodeSelectSelector,
      statusCode
    );
  });

  it('Verify duplicated route response has the same body with the original response', async () => {
    const routeResponseAceContentSelector = '.ace_content';

    await tests.helpers.selectRouteResponse(1);
    await tests.helpers.removeRouteResponse();
    const originalBodyText = await tests.helpers.getElementText(
      routeResponseAceContentSelector
    );
    await tests.helpers.duplicateRouteResponse();

    const duplicatedBodyText = await tests.helpers.getElementText(
      routeResponseAceContentSelector
    );
    expect(duplicatedBodyText).to.equal(originalBodyText);
  });

  it('Verify duplicated route response has the same headers with the original response', async () => {
    await tests.helpers.selectRouteResponse(1);
    await tests.helpers.removeRouteResponse();
    await tests.helpers.switchTab('HEADERS');
    await tests.helpers.addHeader(
      'route-response-headers',

      { key: 'test', value: 'test' }
    );
    await tests.helpers.duplicateRouteResponse();
    await tests.helpers.switchTab('HEADERS');

    await tests.helpers.countElements(
      '#route-response-headers .row.headers-list',
      2
    );

    const selectorAndValueAssertionPairs = {
      '#route-response-headers .row.headers-list:first-child .form-control:first-child':
        'Content-Type',
      '#route-response-headers .row.headers-list:first-child .form-control:nth-child(2)':
        'application/json',
      '#route-response-headers .row.headers-list:nth-child(2) .form-control:first-child':
        'test',
      '#route-response-headers .row.headers-list:nth-child(2) .form-control:nth-child(2)':
        'test'
    };

    for (const selector of Object.keys(selectorAndValueAssertionPairs)) {
      const valueToCompare = selectorAndValueAssertionPairs[selector];
      await tests.helpers.assertElementValue(selector, valueToCompare);
    }
  });

  it('Verify duplicated route response has the same rules with the original response', async () => {
    await tests.helpers.selectRouteResponse(1);
    await tests.helpers.removeRouteResponse();
    await tests.helpers.switchTab('RULES');
    await tests.helpers.addResponseRule({
      target: 'body',
      isRegex: false,
      modifier: 'test',
      value: 'test'
    });
    await tests.app.client.pause(100);
    await tests.helpers.duplicateRouteResponse();
    await tests.helpers.switchTab('RULES');

    await tests.helpers.countElements('app-route-response-rules .row', 1);

    const selectorAndValueAssertionPairs = {
      'app-route-response-rules .row select[formcontrolname="target"]': 'body',
      'app-route-response-rules .row input[formcontrolname="modifier"]': 'test',
      'app-route-response-rules .row input[formcontrolname="value"]': 'test'
    };

    for (const selector of Object.keys(selectorAndValueAssertionPairs)) {
      const valueToCompare = selectorAndValueAssertionPairs[selector];
      await tests.helpers.assertElementValue(selector, valueToCompare);
    }
  });
});
