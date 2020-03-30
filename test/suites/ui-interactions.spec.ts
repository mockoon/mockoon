import { Tests } from 'test/lib/tests';

describe('UI interactions', () => {
  const tests = new Tests('ui');
  tests.runHooks();

  describe('Environments menu', () => {
    it('Collapsed environment menu item displays first two characters of name', async () => {
      await tests.helpers.assertHasActiveEnvironment(' FT');
    });

    it('Collapsed environment menu item displays all icons', async () => {
      await tests.helpers.assertEnvironmentServerIconsExists(1, 'cors');
      await tests.helpers.assertEnvironmentServerIconsExists(1, 'https');
      await tests.helpers.assertEnvironmentServerIconsExists(1, 'proxy-mode');
    });

    it('Collapsed environment menu item has a context menu', async () => {
      await tests.helpers.contextMenuOpen(
        '.environments-menu .nav-item .nav-link.active'
      );
      await tests.app.client.waitForExist(`.context-menu`);
    });

    it('Opened environment menu item displays full name', async () => {
      await tests.helpers.toggleEnvironmentMenu();
      await tests.helpers.assertHasActiveEnvironment('FT env');
    });

    it('Opened environment menu has button to add an environment', async () => {
      await tests.app.client.waitForExist(
        '.environments-menu .nav:first-of-type .nav-item .nav-link.add-environment'
      );
    });

    it('Opened environment menu item displays all icons', async () => {
      await tests.helpers.assertEnvironmentServerIconsExists(1, 'cors');
      await tests.helpers.assertEnvironmentServerIconsExists(1, 'https');
      await tests.helpers.assertEnvironmentServerIconsExists(1, 'proxy-mode');
    });

    it('Opened environment menu item has a context menu', async () => {
      await tests.helpers.contextMenuOpen(
        '.environments-menu .nav-item .nav-link.active'
      );
      await tests.app.client.waitForExist(`.context-menu`);
    });
  });
});
