import { expect } from 'chai';
import { Tests } from 'test/lib/tests';

describe('UI interactions', () => {
  describe('Environments menu', () => {
    const tests = new Tests('ui');

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
      await tests.helpers.waitElementExist('.context-menu');
    });

    it('Opened environment menu item displays full name', async () => {
      await tests.helpers.toggleEnvironmentMenu();
      await tests.helpers.assertHasActiveEnvironment('FT env');
    });

    it('Opened environment menu has button to add an environment', async () => {
      await tests.helpers.waitElementExist(
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
      await tests.helpers.waitElementExist('.context-menu');
    });
  });

  describe('Inputs autofocus', () => {
    const tests = new Tests('ui');

    it('Focus "documentation" input, add route, and assert "path" input has focus', async () => {
      const documentationSelector = 'input[formcontrolname="documentation"]';

      await tests.helpers.setElementValue(documentationSelector, 'test');
      const documentationInput = await tests.helpers.getElement(
        documentationSelector
      );
      expect(await documentationInput.isFocused()).to.equal(true);

      await tests.helpers.addRoute();

      const pathInput = await tests.helpers.getElement(
        'input[formcontrolname="endpoint"]'
      );
      expect(await pathInput.isFocused()).to.equal(true);
    });
  });

  describe('Add CORS headers', () => {
    const tests = new Tests('ui');

    const environmentHeadersSelector =
      'app-headers-list#environment-headers .headers-list';

    it('Switch to environment settings and check headers count', async () => {
      await tests.helpers.switchViewInHeader('ENV_SETTINGS');

      await tests.helpers.countElements(environmentHeadersSelector, 1);
    });

    describe('Check environment headers', () => {
      ['Content-Type', 'application/xml'].forEach((expected, index) => {
        it(`Row 1 input ${
          index + 1
        } should be equal to ${expected}`, async () => {
          const value = await tests.helpers.getElementAttribute(
            `${environmentHeadersSelector}:nth-of-type(1) input:nth-of-type(${
              index + 1
            })`,
            'value'
          );
          expect(value).to.equal(expected);
        });
      });
    });

    it('Click on "Add CORS headers" button and check headers count', async () => {
      await tests.helpers.elementClick('button.settings-add-cors');

      await tests.helpers.countElements(environmentHeadersSelector, 4);
    });

    describe('Check environment headers', () => {
      [
        'Content-Type',
        'application/xml',
        'Access-Control-Allow-Origin',
        '*',
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
        'Access-Control-Allow-Headers',
        'Content-Type, Origin, Accept, Authorization, Content-Length, X-Requested-With'
      ].forEach((expected, index) => {
        it(`Row ${Math.ceil((index + 1) / 2)} input ${
          index + 1
        } should be equal to ${expected}`, async () => {
          const value = await tests.helpers.getElementAttribute(
            `${environmentHeadersSelector}:nth-of-type(${Math.ceil(
              (index + 1) / 2
            )}) input:nth-of-type(${(index + 1) % 2 === 0 ? 2 : 1})`,
            'value'
          );
          expect(value).to.equal(expected);
        });
      });
    });
  });
});
