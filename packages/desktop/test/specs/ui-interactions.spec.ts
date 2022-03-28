import contextMenu from '../libs/context-menu';
import environments from '../libs/environments';
import environmentsSettings from '../libs/environments-settings';
import file from '../libs/file';
import navigation from '../libs/navigation';
import routes from '../libs/routes';
import utils from '../libs/utils';

describe('UI interactions', () => {
  it('should open the environments', async () => {
    await environments.open('ui-1');

    await environments.open('ui-2');
  });

  describe('Environments menu', () => {
    it('should verify the environments menu item content', async () => {
      await environments.select(1);
      await environments.assertActiveMenuEntryText('UI env');

      await environments.assertMenuHTTPSIconPresent();
      await environments.assertMenuProxyIconVisible();
      await contextMenu.openContextMenu('environments');
      await contextMenu.closeContextMenu();
    });
  });

  describe('Environment name inline edit', () => {
    const secondEnvSelector = '.environments-menu .nav-item:nth-child(2)';

    it('should not show the name edit input before and after selecting the environment', async () => {
      await environments.select(1);

      await $(`${secondEnvSelector} .environment-name`).waitForExist();
      await $(
        `${secondEnvSelector} input[formcontrolname="name"]`
      ).waitForExist({ reverse: true });

      await environments.select(2);
      await navigation.switchView('ENV_SETTINGS');

      await $(`${secondEnvSelector} .environment-name`).waitForExist();
      await $(
        `${secondEnvSelector} input[formcontrolname="name"]`
      ).waitForExist({ reverse: true });
    });

    it('should show the name edit input after clicking on the environment name', async () => {
      await $(`${secondEnvSelector} .environment-name`).click();
      await $(`${secondEnvSelector} .environment-name`).waitForExist({
        reverse: true
      });
      await $(
        `${secondEnvSelector} input[formcontrolname="name"]`
      ).waitForExist();
    });

    it('should be able to edit the environment name in the environments menu', async () => {
      await environmentsSettings.assertSettingValue('name', 'UI env name edit');

      await $(`${secondEnvSelector} input[formcontrolname="name"]`).addValue(
        'newname'
      );

      await browser.keys(['Enter']);

      await environmentsSettings.assertSettingValue(
        'name',
        'UI env name editnewname'
      );
    });
  });

  describe('Inputs autofocus', () => {
    it('should focus "documentation" input, add route, and assert "path" input has focus', async () => {
      await environments.select(1);

      await routes.documentationInput.click();
      await routes.documentationInput.setValue('test');

      expect(await routes.documentationInput.isFocused()).toEqual(true);

      await routes.add();

      expect(await routes.pathInput.isFocused()).toEqual(true);
    });
  });

  describe('Input number mask', () => {
    it('should allow numbers', async () => {
      await environments.select(1);
      await navigation.switchView('ENV_SETTINGS');
      await environmentsSettings.setSettingValue('port', '1234');
      await environmentsSettings.assertSettingValue('port', '1234');
    });

    it('should prevent entering letters and other characters', async () => {
      await environmentsSettings.setSettingValue('port', 'a.e-+');
      await environmentsSettings.assertSettingValue('port', '0');
    });

    it('should enforce max constraint', async () => {
      await environmentsSettings.setSettingValue('port', '1000000');
      await environmentsSettings.assertSettingValue('port', '65535');
    });
  });

  describe('Valid path mask', () => {
    it('should remove leading slash', async () => {
      await environments.select(1);
      await navigation.switchView('ENV_SETTINGS');
      await environmentsSettings.setSettingValue('endpointPrefix', '/prefix');
      await environmentsSettings.assertSettingValue('endpointPrefix', 'prefix');
    });

    it('should deduplicate slashes', async () => {
      await environmentsSettings.setSettingValue(
        'endpointPrefix',
        'prefix//path'
      );
      await environmentsSettings.assertSettingValue(
        'endpointPrefix',
        'prefix/path'
      );
    });
  });

  describe('Body editor reset undo state when navigating', () => {
    it('should navigate to second route and verify body', async () => {
      await navigation.switchView('ENV_ROUTES');
      await routes.select(2);

      await routes.assertBody('42');
    });

    it('should try to undo (ctrl-z) and content should stay the same', async () => {
      await routes.bodyEditor.click();
      await browser.keys(['Control', 'z']);
      await routes.assertBody('42');
    });
  });

  describe('Status code dropdown', () => {
    const dropdownId = 'status-code';

    it('should be able to select a status code by clicking', async () => {
      await routes.select(1);
      await utils.openDropdown(dropdownId);
      await utils.selectDropdownItem(dropdownId, 1);

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/ui-1.json',
        'routes.0.responses.0.statusCode',
        100
      );
    });

    it('should be able to filter status codes and select the last one', async () => {
      await utils.openDropdown(dropdownId);
      await utils.setDropdownInputValue(dropdownId, '45');
      await browser.pause(100);
      await utils.assertDropdownItemsNumber(dropdownId, 2);
      await utils.assertDropdownItemText(
        dropdownId,
        1,
        '450 - Blocked by Windows Parental Controls (Microsoft)'
      );
      await utils.assertDropdownItemText(
        dropdownId,
        2,
        '451 - Unavailable For Legal Reasons'
      );
      await utils.selectDropdownItem(dropdownId, 2);

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/ui-1.json',
        'routes.0.responses.0.statusCode',
        451
      );
    });

    it('should be able to select a status code with keyboard arrows', async () => {
      await utils.openDropdown(dropdownId);
      await browser.pause(100);

      await browser.keys(['ArrowUp', 'Enter']);

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/ui-1.json',
        'routes.0.responses.0.statusCode',
        561
      );
      await utils.assertDropdownToggleText(
        dropdownId,
        '561 - Unauthorized (AWS ELB)'
      );
    });

    it('should be able to filter status codes and select one with keyboard arrows', async () => {
      await utils.openDropdown(dropdownId);
      await utils.setDropdownInputValue(dropdownId, '30');
      await browser.pause(100);

      await browser.keys(['ArrowDown', 'ArrowDown', 'Enter']);

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/ui-1.json',
        'routes.0.responses.0.statusCode',
        301
      );
      await utils.assertDropdownToggleText(
        dropdownId,
        '301 - Moved Permanently'
      );
    });

    it('should be able to enter a custom status codes', async () => {
      await utils.openDropdown(dropdownId);
      await utils.setDropdownInputValue(dropdownId, '999');
      await browser.pause(100);
      await utils.assertDropdownItemsNumber(dropdownId, 0);
      await utils.assertElementText(
        $(`#${dropdownId}-dropdown-menu .message`),
        'Press enter for custom status code'
      );

      await browser.keys(['Enter']);

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/ui-1.json',
        'routes.0.responses.0.statusCode',
        999
      );
    });

    it('should not be able to enter a custom status codes out of bounds', async () => {
      await utils.openDropdown(dropdownId);
      await utils.setDropdownInputValue(dropdownId, '99');
      await browser.keys(['Enter']);

      await browser.pause(100);

      await utils.assertDropdownToggleText(dropdownId, '999 - Unknown');
    });
  });

  describe('HTTP methods dropdown', () => {
    const dropdownId = 'methods';

    it('should be able to select a method by clicking', async () => {
      await routes.select(1);
      await utils.openDropdown(dropdownId);
      await utils.selectDropdownItem(dropdownId, 3);

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/ui-1.json',
        'routes.0.method',
        'put'
      );
    });

    it('should be able to select a method by navigating with keyboard', async () => {
      await utils.openDropdown(dropdownId);
      await browser.keys(['ArrowUp', 'Enter']);

      await utils.waitForAutosave();
      await file.verifyObjectPropertyInFile(
        './tmp/storage/ui-1.json',
        'routes.0.method',
        'options'
      );
    });
  });
});
