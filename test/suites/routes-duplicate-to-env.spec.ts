import { expect } from 'chai';
import { Tests } from 'test/lib/tests';

describe('Duplicate a route to an environment', async () => {
  const { helpers } = new Tests('basic-data');

  const envNameSelector =
    '.modal-content .modal-body .list-group .list-group-item:first-child div:first-of-type';
  const envHostnameSelector =
    '.modal-content .modal-body .list-group .list-group-item:first-child div:last-of-type';

  it('should assert that menu entry is disabled when only one environment present', async () => {
    await helpers.assertContextMenuDisabled(
      '.routes-menu .menu-list .nav-item:last-child .nav-link',
      2,
      true
    );
  });

  it('should add a new environment and assert that menu entry is enabled', async () => {
    await helpers.toggleEnvironmentMenu();
    await helpers.addEnvironment();
    await helpers.selectEnvironment(1);
    await helpers.toggleEnvironmentMenu();

    await helpers.assertContextMenuDisabled(
      '.routes-menu .menu-list .nav-item:last-child .nav-link',
      2,
      false
    );
  });

  it("should open duplication modal and verify selected route's information on modal", async () => {
    await helpers.contextMenuClick(
      '.routes-menu .menu-list .nav-item:last-child .nav-link',
      2
    );

    await helpers.waitElementExist('.modal-dialog');

    const targetRoute = await helpers.getElementText(
      '.modal-content .modal-title small'
    );

    expect(targetRoute).to.include('POST /dolphins');

    const targetEnvironmentName = await helpers.getElementText(envNameSelector);
    expect(targetEnvironmentName).to.equal('New environment');

    const targetEnvironmentHostname = await helpers.getElementText(
      envHostnameSelector
    );
    expect(targetEnvironmentHostname).to.equal('0.0.0.0:3001/');
  });

  it('should duplicate selected route to selected environment', async () => {
    await helpers.elementClick(envNameSelector);

    await helpers.assertActiveEnvironmentName('New environment');
    await helpers.checkActiveRoute('POST\n/dolphins');
  });

  it('should duplicate selected route with the same properties', async () => {
    await helpers.assertElementText(
      'app-custom-select[formcontrolname="method"] .dropdown-toggle-label',
      'POST'
    );

    await helpers.assertElementValue(
      '.main-content .input-group input',
      'dolphins'
    );

    await helpers.switchTab('HEADERS');

    await helpers.assertElementValue(
      '.headers-list:first-child .input-group [formcontrolname="key"]',
      'Content-Type'
    );
    await helpers.assertElementValue(
      '.headers-list:first-child .input-group [formcontrolname="value"]',
      'application/json'
    );
  });
});
