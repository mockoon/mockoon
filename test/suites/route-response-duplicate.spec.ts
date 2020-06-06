import { Tests } from 'test/lib/tests';
import { expect } from 'chai';

const tests = new Tests('basic-data');

describe('Duplicate a route response', async () => {
  tests.runHooks();

  it('Verify single route response', async () => {
    await tests.helpers.countRouteResponses(1);
  });

  it('Duplicate first route response', async () => {
    await tests.helpers.countRouteResponses(1);
    await tests.helpers.duplicateRouteResponse();
    await tests.helpers.countRouteResponses(2);
  });

  it('Verify duplicated route response has the label with the "(copy)" tag', async () => {
    const label = 'Test';
    const labelToCompare = 'Test (copy)';
    const routeResponseLabelInputSelector = '.input-group .form-control[formcontrolname="label"]';

    await tests.helpers.removeDuplicatedRouteResponse();
    await tests.app.client.element(routeResponseLabelInputSelector).setValue(label);
    await tests.helpers.duplicateRouteResponse();

    const labelText = await tests.app.client.getValue(routeResponseLabelInputSelector);
    expect(labelText).to.equal(labelToCompare);
  });

  it('Verify duplicated route response has the same status code with the original response', async () => {
    const routeResponseStatusCodeSelectSelector = '.input-group .custom-select[formcontrolname="statusCode"]';
    const statusCode = '400';

    await tests.helpers.removeDuplicatedRouteResponse();
    await tests.app.client.element(routeResponseStatusCodeSelectSelector).selectByValue(statusCode);
    await tests.helpers.duplicateRouteResponse();

    const statusCodeValue = await tests.app.client.getValue(routeResponseStatusCodeSelectSelector);
    expect(statusCodeValue).to.equal(statusCode);
  });

  it('Verify duplicated route response has the same body with the original response', async () => {
    const routeResponseAceContentSelector = '.ace_content';

    await tests.helpers.removeDuplicatedRouteResponse();
    const originalBodyText = await tests.app.client.getText(routeResponseAceContentSelector);
    await tests.helpers.duplicateRouteResponse();

    const duplicatedBodyText = await tests.app.client.getText(routeResponseAceContentSelector);
    expect(duplicatedBodyText).to.equal(originalBodyText);
  });

  it('Verify duplicated route response has the same headers with the original response', async () => {


    await tests.helpers.removeDuplicatedRouteResponse();
    await tests.helpers.switchTab('HEADERS');
    await tests.helpers.addHeader(
      'route-response-headers',

      { key: 'test', value: 'test' });
    await tests.helpers.duplicateRouteResponse();
    await tests.helpers.switchTab('HEADERS');

    await tests.app.client.elements('#route-response-headers .row.headers-list')
      .should.eventually.have.property('value')
      .to.be.an('Array')
      .that.have.lengthOf(2);

    const firstRowFirstControlSelector = '#route-response-headers .row.headers-list:first-child .form-control:first-child';
    const firstRowSecondControlSelector = '#route-response-headers .row.headers-list:first-child .form-control:nth-child(2)';
    const secondRowFirstControlSelector = '#route-response-headers .row.headers-list:nth-child(2) .form-control:first-child';
    const secondRowSecondControlSelector = '#route-response-headers .row.headers-list:nth-child(2) .form-control:nth-child(2)';
    expect(await tests.app.client.getValue(firstRowFirstControlSelector))
      .to.equal('Content-Type');
    expect(await tests.app.client.getValue(firstRowSecondControlSelector))
      .to.equal('application/json');
    expect(await tests.app.client.getValue(secondRowFirstControlSelector))
      .to.equal('test');
    expect(await tests.app.client.getValue(secondRowSecondControlSelector))
      .to.equal('test');
  });

  it('Verify duplicated route response has the same rules with the original response', async () => {
    await tests.helpers.removeDuplicatedRouteResponse();
    await tests.helpers.switchTab('RULES');
    await tests.helpers.addResponseRule({ target: 'body', isRegex: false, modifier: 'test', value: 'test' });
    await tests.app.client.pause(100);
    await tests.helpers.duplicateRouteResponse();
    await tests.helpers.switchTab('RULES');

    await tests.app.client.elements('app-route-response-rules .row')
      .should.eventually.have.property('value')
      .to.be.an('Array')
      .that.have.lengthOf(1);

    const ruleTargetSelectSelector = 'app-route-response-rules .row select[formcontrolname="target"]';
    const ruleModifierInputSelector = 'app-route-response-rules .row input[formcontrolname="modifier"]';
    const ruleValueInputSelector = 'app-route-response-rules .row input[formcontrolname="value"]';
    expect(await tests.app.client.getValue(ruleTargetSelectSelector)).to.equal('body');
    expect(await tests.app.client.getValue(ruleModifierInputSelector)).to.equal('test');
    expect(await tests.app.client.getValue(ruleValueInputSelector)).to.equal('test');
  });

});
