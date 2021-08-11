import { expect } from 'chai';
import { resolve } from 'path';
import { Tests } from 'test/lib/tests';

describe('Duplicate a route to an environment', async () => {
  const { helpers } = new Tests('basic-data');
  const firstEnvSelector =
    '.modal-content .modal-body .list-group .list-group-item:first-child';

  it('should assert that menu entry is disabled when only one environment present', async () => {
    await helpers.assertContextMenuDisabled(
      '.routes-menu .menu-list .nav-item:last-child .nav-link',
      2,
      true
    );
  });

  it('should add a new environment and assert that menu entry is enabled', async () => {
    helpers.mockDialog('showSaveDialog', [
      resolve('./tmp/storage/new-env-test.json')
    ]);
    await helpers.addEnvironment();
    await helpers.selectEnvironment(1);

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

    const targetEnvironmentName = await helpers.getElementText(
      firstEnvSelector
    );

    expect(targetEnvironmentName).to.equal('New environment');
  });

  it('should duplicate selected route to selected environment', async () => {
    await helpers.elementClick(firstEnvSelector);

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
