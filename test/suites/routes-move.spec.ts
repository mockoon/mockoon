import { Tests } from 'test/lib/tests';
import { expect } from 'chai';


describe('Move a route', async () => {
  const { helpers } = new Tests('basic-data');

  it('should verify selected route\'s information on modal', async () => {

    await helpers.toggleEnvironmentMenu();
    await helpers.addEnvironment();
    await helpers.selectEnvironment(1);
    await helpers.toggleEnvironmentMenu();

    await helpers.contextMenuClick(
      '.routes-menu .menu-list .nav-item:last-child .nav-link',
      5
    );

    await helpers.waitElementExist('.modal-content');

    const methodText = await helpers.getElementText('.modal-content .modal-header__method');
    const endpointText = await helpers.getElementText('.modal-content .modal-header__endpoint');

    expect(methodText).to.equal('POST');
    expect(endpointText).to.equal('dolphins');

    const targetEnvironmentName = await helpers.getElementText('.modal-content .modal-body .target-environment__list .target-environment__item:first-child .environment-name');

    expect(targetEnvironmentName).to.equal('New environment');
  });

  it('should move selected route to selected environment', async () => {
    await helpers.elementClick('.modal-content .modal-body .target-environment__list .target-environment__item:first-child');

    const movedRouteSelector = '.routes-menu .menu-list .nav-item:last-child';

    const movedRouteLink = await helpers.getElement(`${movedRouteSelector} .nav-link`);
    expect((await movedRouteLink.getAttribute('class')).includes('active')).to.be.true;

    const movedRouteRoutePathText = await helpers.getElementText(`${movedRouteSelector} .nav-link .route-path`);
    expect(movedRouteRoutePathText).to.include('/dolphins');

    const movedRoutePathBadgeText = await helpers.getElementText(`${movedRouteSelector} .nav-link .route-path .badge`);
    expect(movedRoutePathBadgeText).to.equal('POST');
  });

  it('should move selected route with the same properties', async () => {
    await helpers.assertElementValue('.main-content .input-group .custom-select', 'post');
    await helpers.assertElementValue('.main-content .input-group input', 'dolphins');

    await helpers.switchTab('HEADERS');

    helpers.assertElementValue('.headers-list:first-child .input-group [formcontrolname="key"]', 'Content-Type');
    helpers.assertElementValue('.headers-list:first-child .input-group [formcontrolname="value"]', 'application/json');

  });
});
