import { expect } from 'chai';
import { Tests } from 'test/lib/tests';

describe('UI interactions', () => {
  describe('Environments menu', () => {
    const tests = new Tests('ui');
    tests.runHooks();

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

  describe('Add CORS headers', () => {
    const tests = new Tests('ui');
    tests.runHooks();

    const environmentHeadersSelector =
      'app-headers-list#environment-headers .row.headers-list';

    it('Switch to environment settings and check headers count', async () => {
      await tests.helpers.switchViewInHeader('ENV_SETTINGS');

      await tests.app.client
        .elements(environmentHeadersSelector)
        .should.eventually.have.property('value')
        .to.be.an('Array')
        .that.have.lengthOf(1);
    });

    describe('Check environment headers', () => {
      ['Content-Type', 'application/xml'].forEach((expected, index) => {
        it(`Row 1 input ${
          index + 1
        } should be equal to ${expected}`, async () => {
          const value = await (tests.app.client
            .element(
              `${environmentHeadersSelector}:nth-of-type(1) input:nth-of-type(${
                index + 1
              })`
            )
            .getAttribute('value') as string);
          expect(value).to.equal(expected);
        });
      });
    });

    it('Click on "Add CORS headers" button and check headers count', async () => {
      await tests.app.client.element('button.settings-add-cors').click();

      await tests.app.client
        .elements(environmentHeadersSelector)
        .should.eventually.have.property('value')
        .to.be.an('Array')
        .that.have.lengthOf(4);
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
          const value = await (tests.app.client
            .element(
              `${environmentHeadersSelector}:nth-of-type(${Math.ceil(
                (index + 1) / 2
              )}) input:nth-of-type(${(index + 1) % 2 === 0 ? 2 : 1})`
            )
            .getAttribute('value') as string);
          expect(value).to.equal(expected);
        });
      });
    });
  });
});
