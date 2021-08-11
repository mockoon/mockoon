import { expect } from 'chai';
import { Tests } from 'test/lib/tests';

describe('UI interactions', () => {
  describe('Environments menu', () => {
    const tests = new Tests('ui');

    it('Verify environments men item content', async () => {
      await tests.helpers.assertHasActiveEnvironment('FT env');
      await tests.helpers.assertEnvironmentServerIconsExists(1, 'cors');
      await tests.helpers.assertEnvironmentServerIconsExists(1, 'https');
      await tests.helpers.assertEnvironmentServerIconsExists(1, 'proxy-mode');
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
          const value = await tests.helpers.getElementValue(
            `${environmentHeadersSelector}:nth-of-type(1) input:nth-of-type(${
              index + 1
            })`
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
          const value = await tests.helpers.getElementValue(
            `${environmentHeadersSelector}:nth-of-type(${Math.ceil(
              (index + 1) / 2
            )}) input:nth-of-type(${(index + 1) % 2 === 0 ? 2 : 1})`
          );
          expect(value).to.equal(expected);
        });
      });
    });
  });

  describe('Headers && Rules tabs', () => {
    const tests = new Tests('ui');

    it('Headers tab shows the header count', async () => {
      const headersTabSelector =
        '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(2)';

      let text = await tests.helpers.getElementText(headersTabSelector);
      expect(text).to.equal('Headers (1)');

      await tests.helpers.switchTab('HEADERS');
      await tests.helpers.addHeader('route-response-headers', {
        key: 'route-header',
        value: 'route-header'
      });

      // this is needed for the tab re-render to complete
      await tests.app.client.pause(100);
      text = await tests.helpers.getElementText(headersTabSelector);
      expect(text).to.equal('Headers (2)');

      await tests.helpers.addHeader('route-response-headers', {
        key: 'route-header-2',
        value: 'route-header-2'
      });

      // this is needed for the tab re-render to complete
      await tests.app.client.pause(100);
      text = await tests.helpers.getElementText(headersTabSelector);
      expect(text).to.equal('Headers (3)');

      await tests.helpers.addRouteResponse();
      await tests.helpers.countRouteResponses(2);

      // this is needed for the tab re-render to complete
      await tests.app.client.pause(100);
      text = await tests.helpers.getElementText(headersTabSelector);
      expect(text).to.equal('Headers');

      await tests.helpers.switchTab('HEADERS');
      await tests.helpers.addHeader('route-response-headers', {
        key: 'route-header-3',
        value: 'route-header-3'
      });

      // this is needed for the tab re-render to complete
      await tests.app.client.pause(100);
      text = await tests.helpers.getElementText(headersTabSelector);
      expect(text).to.equal('Headers (1)');
    });

    it('Rules tab shows the rule count', async () => {
      const rulesTabSelector =
        '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(3)';

      let text = await tests.helpers.getElementText(rulesTabSelector);
      expect(text).to.equal('Rules');

      await tests.helpers.switchTab('RULES');
      await tests.helpers.addResponseRule({
        modifier: 'var',
        target: 'params',
        value: '10',
        isRegex: false
      });

      // this is needed for the tab re-render to complete
      await tests.app.client.pause(100);
      text = await tests.helpers.getElementText(rulesTabSelector);
      expect(text).to.equal('Rules (1)');

      await tests.helpers.addResponseRule({
        modifier: 'test',
        target: 'query',
        value: 'true',
        isRegex: false
      });

      // this is needed for the tab re-render to complete
      await tests.app.client.pause(100);
      text = await tests.helpers.getElementText(rulesTabSelector);
      expect(text).to.equal('Rules (2)');

      await tests.helpers.addRouteResponse();
      await tests.helpers.countRouteResponses(3);

      // this is needed for the tab re-render to complete
      await tests.app.client.pause(100);
      text = await tests.helpers.getElementText(rulesTabSelector);
      expect(text).to.equal('Rules');

      await tests.helpers.switchTab('RULES');
      await tests.helpers.addResponseRule({
        modifier: 'var',
        target: 'params',
        value: '10',
        isRegex: false
      });

      // this is needed for the tab re-render to complete
      await tests.app.client.pause(100);
      text = await tests.helpers.getElementText(rulesTabSelector);
      expect(text).to.equal('Rules (1)');
    });
  });

  describe('Input number mask', () => {
    const tests = new Tests('ui');
    const portSelector = 'input[formcontrolname="port"]';

    it('should allow numbers', async () => {
      await tests.helpers.setElementValue(portSelector, '1234');
      await tests.helpers.assertElementValue(portSelector, '1234');
    });

    it('should prevent entering letters and other characters', async () => {
      await tests.helpers.addElementValue(portSelector, 'a.e-+');
      await tests.helpers.assertElementValue(portSelector, '1234');
    });

    it('should enforce max constraint', async () => {
      await tests.helpers.setElementValue(portSelector, '1000000');
      await tests.helpers.assertElementValue(portSelector, '65535');
    });
  });

  describe('Valid path mask', () => {
    const tests = new Tests('ui');
    const prefixSelector = 'input[formcontrolname="endpointPrefix"]';

    it('should remove leading slash', async () => {
      await tests.helpers.setElementValue(prefixSelector, '/prefix');
      await tests.helpers.assertElementValue(prefixSelector, 'prefix');
    });

    it('should deduplicate slashes', async () => {
      await tests.helpers.setElementValue(prefixSelector, 'prefix//path');
      await tests.helpers.assertElementValue(prefixSelector, 'prefix/path');
    });
  });

  describe('Body editor reset undo state when navigating', () => {
    const tests = new Tests('ui');
    const bodySelector = '.ace_content';

    it('should navigate to second route and verify body', async () => {
      await tests.helpers.selectRoute(2);
      await tests.helpers.assertElementText(bodySelector, '42');
    });

    it('should try to undo (ctrl-z) and content should stay the same', async () => {
      const bodyElement = await tests.app.client.$(bodySelector);
      await tests.helpers.elementClick(bodySelector);
      await bodyElement.keys(['Control', 'z']);
      await tests.helpers.assertElementText(bodySelector, '42');
    });
  });

  describe('Headers typeahead', () => {
    const tests = new Tests('ui');
    const typeaheadEntrySelector = 'ngb-typeahead-window button:first-of-type';

    const testCases = [
      {
        description: 'should use the typeahead in the route headers',
        headers: 'route-response-headers',
        preHook: async () => {
          await tests.helpers.switchTab('HEADERS');
        }
      },
      {
        description: 'should use the typeahead in the environment headers',
        headers: 'environment-headers',
        preHook: async () => {
          await tests.helpers.switchViewInHeader('ENV_SETTINGS');
        }
      },
      {
        description: 'should use the typeahead in the proxy request headers',
        headers: 'proxy-req-headers',
        preHook: async () => {
          await tests.helpers.switchViewInHeader('ENV_SETTINGS');
        }
      },
      {
        description: 'should use the typeahead in the proxy response headers',
        headers: 'proxy-res-headers',
        preHook: async () => {
          await tests.helpers.switchViewInHeader('ENV_SETTINGS');
        }
      }
    ];

    testCases.forEach((testCase) => {
      const headersSelector = `app-headers-list#${testCase.headers}`;
      const firstHeaderSelector = `${headersSelector} .headers-list:last-of-type input:nth-of-type(1)`;

      it(testCase.description, async () => {
        await testCase.preHook();
        await tests.helpers.elementClick(`${headersSelector} button`);
        await tests.helpers.setElementValue(firstHeaderSelector, 'typ');
        await tests.helpers.waitElementExist(typeaheadEntrySelector);
        await tests.helpers.elementClick(typeaheadEntrySelector);
        const headerName = await tests.helpers.getElementValue(
          firstHeaderSelector
        );
        expect(headerName).to.equal('Content-Type');
      });
    });
  });

  describe('Status code dropdown', () => {
    const tests = new Tests('ui');
    const dropdownId = 'status-code';

    it('should be able to select a status code by clicking', async () => {
      await tests.helpers.openDropdown(dropdownId);
      await tests.helpers.selectDropdownItem(dropdownId, 1);

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'routes.0.responses.0.statusCode',
        100
      );
    });

    it('should be able to filter status codes and select the last one', async () => {
      await tests.helpers.openDropdown(dropdownId);
      await tests.helpers.setDropdownInputValue(dropdownId, '45');
      await tests.app.client.pause(100);
      await tests.helpers.assertDropdownItemsNumber(dropdownId, 2);
      await tests.helpers.assertDropdownItemText(
        dropdownId,
        1,
        '450 - Blocked by Windows Parental Controls (Microsoft)'
      );
      await tests.helpers.assertDropdownItemText(
        dropdownId,
        2,
        '451 - Unavailable For Legal Reasons'
      );
      await tests.helpers.selectDropdownItem(dropdownId, 2);

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'routes.0.responses.0.statusCode',
        451
      );
    });

    it('should be able to select a status code with keyboard arrows', async () => {
      await tests.helpers.openDropdown(dropdownId);
      await tests.app.client.pause(100);

      await tests.app.client.keys(['ArrowUp', 'Enter']);

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'routes.0.responses.0.statusCode',
        561
      );
      await tests.helpers.assertDropdownToggleText(
        dropdownId,
        '561 - Unauthorized (AWS ELB)'
      );
    });

    it('should be able to filter status codes and select one with keyboard arrows', async () => {
      await tests.helpers.openDropdown(dropdownId);
      await tests.helpers.setDropdownInputValue(dropdownId, '30');
      await tests.app.client.pause(100);

      await tests.app.client.keys(['ArrowDown', 'ArrowDown', 'Enter']);

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'routes.0.responses.0.statusCode',
        301
      );
      await tests.helpers.assertDropdownToggleText(
        dropdownId,
        '301 - Moved Permanently'
      );
    });

    it('should be able to enter a custom status codes', async () => {
      await tests.helpers.openDropdown(dropdownId);
      await tests.helpers.setDropdownInputValue(dropdownId, '999');
      await tests.app.client.pause(100);
      await tests.helpers.assertDropdownItemsNumber(dropdownId, 0);
      await tests.helpers.assertElementText(
        `#${dropdownId}-dropdown-menu .message`,
        'Press enter for custom status code'
      );

      await tests.app.client.keys(['Enter']);

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'routes.0.responses.0.statusCode',
        999
      );
    });

    it('should not be able to enter a custom status codes out of bounds', async () => {
      await tests.helpers.openDropdown(dropdownId);
      await tests.helpers.setDropdownInputValue(dropdownId, '99');
      await tests.app.client.keys(['Enter']);

      await tests.app.client.pause(100);

      await tests.helpers.assertDropdownToggleText(dropdownId, '999 - Unknown');
    });
  });

  describe('HTTP methods dropdown', () => {
    const tests = new Tests('ui');
    const dropdownId = 'methods';

    it('should be able to select a method by clicking', async () => {
      await tests.helpers.openDropdown(dropdownId);
      await tests.helpers.selectDropdownItem(dropdownId, 3);

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'routes.0.method',
        'put'
      );
    });

    it('should be able to select a method by navigating with keyboard', async () => {
      await tests.helpers.openDropdown(dropdownId);
      await tests.app.client.keys(['ArrowUp', 'Enter']);

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        'routes.0.method',
        'options'
      );
    });
  });

  describe('Response rules random or sequential', () => {
    const tests = new Tests('ui');
    const randomResponseSelector = '#route-responses-random';
    const sequentialResponseSelector = '#route-responses-sequential';

    it('should enable random responses', async () => {
      await tests.helpers.elementClick(randomResponseSelector);
      await tests.helpers.assertHasClass(
        `${randomResponseSelector} i`,
        'text-primary'
      );
      await tests.helpers.assertHasClass(
        `${sequentialResponseSelector} i`,
        'text-primary',
        true
      );

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        ['routes.0.randomResponse', 'routes.0.sequentialResponse'],
        [true, false]
      );
    });

    it('should enable sequential responses and random responses should be disabled', async () => {
      await tests.helpers.elementClick(sequentialResponseSelector);
      await tests.helpers.assertHasClass(
        `${randomResponseSelector} i`,
        'text-primary',
        true
      );
      await tests.helpers.assertHasClass(
        `${sequentialResponseSelector} i`,
        'text-primary'
      );

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        ['routes.0.randomResponse', 'routes.0.sequentialResponse'],
        [false, true]
      );
    });

    it('should re-enable random responses and sequential responses should be disabled', async () => {
      await tests.helpers.elementClick(randomResponseSelector);
      await tests.helpers.assertHasClass(
        `${randomResponseSelector} i`,
        'text-primary'
      );
      await tests.helpers.assertHasClass(
        `${sequentialResponseSelector} i`,
        'text-primary',
        true
      );

      await tests.helpers.waitForAutosave();
      await tests.helpers.verifyObjectPropertyInFile(
        './tmp/storage/environment-0.json',
        ['routes.0.randomResponse', 'routes.0.sequentialResponse'],
        [true, false]
      );
    });
  });
});
