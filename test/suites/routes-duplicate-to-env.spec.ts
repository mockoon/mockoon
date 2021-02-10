import { expect } from 'chai';
import { Tests } from 'test/lib/tests';

describe('Duplicate a route to an environment', async () => {
  const { helpers } = new Tests('basic-data');
  const firstEnvSelector =
    '.modal-content .modal-body .list-group .list-group-item:first-child';

  it("should verify selected route's information on modal", async () => {
    await helpers.toggleEnvironmentMenu();
    await helpers.addEnvironment();
    await helpers.selectEnvironment(1);
    await helpers.toggleEnvironmentMenu();

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
    await helpers.assertElementValue(
      '.main-content .input-group .custom-select',
      'post'
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
