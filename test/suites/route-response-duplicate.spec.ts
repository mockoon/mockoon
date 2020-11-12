import { Tests } from 'test/lib/tests';

describe('Duplicate a route response', () => {
  const tests = new Tests('responses-rules');

  it('Setup and duplicate first route response', async () => {
    await tests.helpers.countRouteResponses(1);

    await tests.helpers.duplicateRouteResponse();
  });

  it('Verify duplicated route response label', async () => {
    await tests.helpers.assertElementValue(
      '.input-group .form-control[formcontrolname="label"]',
      'Test (copy)'
    );
  });

  it('Verify duplicated route response status code', async () => {
    await tests.helpers.assertElementValue(
      '.input-group .custom-select[formcontrolname="statusCode"]',
      '50: 500'
    );
  });

  it('Verify duplicated route response headers', async () => {
    await tests.helpers.switchTab('HEADERS');

    await tests.helpers.countElements(
      '#route-response-headers .headers-list',
      1
    );

    await tests.helpers.assertElementValue(
      '#route-response-headers .headers-list:first-child .form-control:first-child',
      'Content-Type'
    );
    await tests.helpers.assertElementValue(
      '#route-response-headers .headers-list:first-child .form-control:nth-child(2)',
      'application/json'
    );
  });

  it('Verify duplicated route response rules', async () => {
    await tests.helpers.switchTab('RULES');
    await tests.helpers.countElements('app-route-response-rules .rule-item', 1);

    const selectorAndValueAssertionPairs = {
      'app-route-response-rules .rule-item select[formcontrolname="target"]': 'body',
      'app-route-response-rules .rule-item input[formcontrolname="modifier"]': 'test',
      'app-route-response-rules .rule-item input[formcontrolname="value"]': 'test'
    };

    for (const selector of Object.keys(selectorAndValueAssertionPairs)) {
      const valueToCompare = selectorAndValueAssertionPairs[selector];
      await tests.helpers.assertElementValue(selector, valueToCompare);
    }
  });
});
