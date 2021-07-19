import {
  Environments,
  Header,
  LogicalOperators,
  ResponseRule
} from '@mockoon/commons';
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { get as objectGetPath } from 'object-path';
import { ToastTypes } from 'src/renderer/app/models/toasts.model';
import {
  EnvironmentLogsTabsNameType,
  TabsNameType,
  ViewsNameType
} from 'src/renderer/app/stores/store';
import { fetch } from 'test/lib/fetch';
import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

export class Helpers {
  constructor(private testsInstance: Tests) {}

  public async getElement(selector: string) {
    const element = await this.testsInstance.app.client.$(selector);

    return element;
  }

  public async waitElementExist(selector: string, reverse: boolean = false) {
    const element = await this.getElement(selector);
    await element.waitForExist({ reverse });
  }

  public async elementClick(
    selector: string,
    button: 'left' | 'right' = 'left'
  ) {
    const element = await this.getElement(selector);
    await element.click({ button });
  }

  public async getElementValue(selector: string) {
    const element = await this.getElement(selector);
    const elementText = await element.getValue();

    return elementText;
  }

  /**
   * /!\ element.setValue is doing a "clearValue" first
   */
  public async setElementValue(
    selector: string,
    value: string | number | boolean
  ) {
    const element = await this.getElement(selector);
    // ensure we unfocus previously selected fields (on Linux, using setValue, previous fields with typeaheads may still show the menu and not be immediately unfocused)
    await element.click();
    await element.setValue(value);
  }

  public async addElementValue(
    selector: string,
    value: string | number | boolean
  ) {
    const element = await this.getElement(selector);
    await element.addValue(value);
  }

  public async clearElementValue(selector: string) {
    const element = await this.getElement(selector);
    await element.clearValue();
  }

  public async assertElementValue(selector: string, valueToCompare: string) {
    const element = await this.getElement(selector);
    expect(await element.getValue()).to.equal(valueToCompare);
  }

  public async selectByAttribute(
    selector: string,
    attribute: string,
    value: string
  ) {
    const element = await this.getElement(selector);
    await element.selectByAttribute(attribute, value);
  }

  public async getElementText(selector: string) {
    const element = await this.getElement(selector);
    const elementText = await element.getText();

    return elementText;
  }

  public async assertElementText(selector: string, valueToCompare: string) {
    const elementText = await this.getElementText(selector);
    expect(elementText).to.equal(valueToCompare);
  }

  public async getElementAttribute(selector: string, attribute: string) {
    const element = await this.getElement(selector);
    const elementAttribute = await element.getAttribute(attribute);

    return elementAttribute;
  }

  public async countElements(selector: string, expected: number) {
    await this.testsInstance.app.client
      .$$(selector)
      .should.eventually.be.an('Array')
      .that.have.lengthOf(expected);
  }

  public async addEnvironment() {
    await this.elementClick(
      '.environments-menu .nav:first-of-type .nav-item .nav-link.add-environment'
    );
  }

  public async removeEnvironment(index: number) {
    await this.contextMenuClickAndConfirm(
      `.environments-menu .menu-list .nav-item:nth-child(${index}) .nav-link`,
      5
    );
  }

  public async duplicateEnvironment(index: number) {
    await this.contextMenuClick(
      `.environments-menu .menu-list .nav-item:nth-of-type(${index})`,
      3
    );
  }

  public async addRoute() {
    await this.elementClick(
      '.routes-menu .nav:first-of-type .nav-item .nav-link'
    );
  }

  public async removeRoute(index: number) {
    await this.contextMenuClickAndConfirm(
      `.routes-menu .menu-list .nav-item:nth-child(${index}) .nav-link`,
      5
    );
  }

  public async addRouteResponse() {
    await this.elementClick('#route-responses-menu #route-response-add');
  }

  public async removeRouteResponse() {
    const deleteButtonSelector =
      '#route-responses-menu #route-response-removal-button';

    await this.elementClick(deleteButtonSelector);
    await this.elementClick(deleteButtonSelector);
  }

  public async duplicateRouteResponse() {
    const duplicationButtonSelector =
      '#route-responses-menu #route-response-duplication-button';
    await this.elementClick(duplicationButtonSelector);
  }

  public async countEnvironments(expected: number) {
    await this.countElements(
      '.environments-menu .menu-list .nav-item',
      expected
    );
  }

  public async countRoutes(expected: number) {
    await this.countElements('.routes-menu .menu-list .nav-item', expected);
  }

  public async countRouteResponses(expected: number) {
    await this.countElements(
      '.route-responses-dropdown-menu .dropdown-item',
      expected
    );
  }

  public async countEnvironmentLogsEntries(expected: number) {
    await this.countElements(
      '.environment-logs-column:nth-child(1) .menu-list .nav-item',
      expected
    );
  }

  public async toggleEnvironmentMenu() {
    await this.elementClick(
      '.environments-menu .nav:first-of-type .nav-item .nav-link.toggle-environments-menu'
    );
    // wait for environment menu to open/close
    await this.testsInstance.app.client.pause(310);
  }

  public async contextMenuOpen(targetMenuItemSelector: string) {
    await this.elementClick(targetMenuItemSelector, 'right');
  }

  public async contextMenuClick(
    targetMenuItemSelector: string,
    contextMenuItemIndex: number
  ) {
    await this.elementClick(targetMenuItemSelector, 'right');
    await this.elementClick(
      `.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`
    );
  }
  public async assertContextMenuDisabled(
    targetMenuItemSelector: string,
    contextMenuItemIndex: number,
    disabled: boolean
  ) {
    await this.elementClick(targetMenuItemSelector, 'right');
    await this.assertHasClass(
      `.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`,
      'disabled',
      !disabled
    );
  }

  public async contextMenuClickAndConfirm(
    targetMenuItemSelector: string,
    contextMenuItemIndex: number
  ) {
    await this.elementClick(targetMenuItemSelector, 'right');
    // click twice to confirm (cannot double click)
    await this.elementClick(
      `.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`
    );
    await this.elementClick(
      `.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`
    );
  }

  public async assertHasClass(
    selector: string,
    hasClass: string,
    inverted = false
  ) {
    const classes = await this.getElementAttribute(selector, 'class');

    if (inverted) {
      expect(classes).not.to.include(hasClass);
    } else {
      expect(classes).to.include(hasClass);
    }
  }

  public async startEnvironment() {
    await this.elementClick('.btn i[ngbtooltip="Start server"]');
    await this.waitElementExist(
      '.environments-menu .menu-list .nav-item .nav-link.active.running'
    );
  }

  public async stopEnvironment() {
    await this.elementClick('.btn i[ngbtooltip="Stop server"]');
    await this.waitElementExist(
      '.environments-menu .menu-list .nav-item .nav-link.active.running',
      true
    );
  }

  public async restartEnvironment() {
    await this.elementClick('.btn i[ngbtooltip="Server needs restart"]');
    await this.waitElementExist(
      '.environments-menu .menu-list .nav-item .nav-link.active.running'
    );
  }

  public async assertEnvironmentServerIconsExists(
    index: number,
    iconName: 'cors' | 'https' | 'proxy-mode'
  ) {
    const selector = `.environments-menu .nav-item:nth-child(${index}) .nav-link.active .server-icons-${iconName}`;
    await this.waitElementExist(selector);
  }

  public async assertHasActiveEnvironment(name?: string, reverse = false) {
    const selector = '.environments-menu .nav-item .nav-link.active';
    await this.waitElementExist(selector, reverse);

    if (name) {
      const text = await this.getElementText(selector + ' > div:first-of-type');
      expect(text).to.equal(name);
    }
  }

  public async checkEnvironmentNeedsRestart() {
    await this.waitElementExist(
      '.environments-menu .menu-list .nav-item .nav-link.active.need-restart'
    );
  }

  public async checkEnvironmentSelected(index: number) {
    await this.waitElementExist(
      `.environments-menu .menu-list .nav-item:nth-child(${index}) .nav-link.active`
    );
  }

  public async checkNoEnvironmentSelected() {
    await this.waitElementExist(
      '.environments-menu .menu-list .nav-item .nav-link.active',
      true
    );
  }

  public async selectEnvironment(index: number) {
    await this.elementClick(
      `.environments-menu .menu-list .nav-item:nth-child(${index}) .nav-link`
    );
  }

  public async checkActiveRoute(name?: string, reverse = false) {
    const selector = '.routes-menu .nav-item .nav-link.active';
    await this.waitElementExist(selector, reverse);

    if (name) {
      const text = await this.getElementText(selector + ' > div:first-of-type');
      expect(text).to.equal(name);
    }
  }

  public async selectRoute(index: number) {
    await this.elementClick(
      `.routes-menu .nav.menu-list .nav-item:nth-child(${index})`
    );
  }

  public async selectRouteResponse(index: number) {
    await this.elementClick('#route-responses-menu .dropdown-toggle');
    await this.elementClick(
      `.route-responses-dropdown-menu .dropdown-item:nth-child(${index})`
    );
  }

  public async checkToastDisplayed(toastType: ToastTypes, text: string) {
    const toastSelector = `.toast.toast-${toastType}`;

    await this.waitElementExist(toastSelector);

    if (text) {
      const elementText = await this.getElementText(
        `${toastSelector} .toast-body`
      );
      expect(elementText).to.contain(text);
    }
  }

  public async switchViewInHeader(viewName: Exclude<ViewsNameType, 'ROUTE'>) {
    const selectors: { [key in typeof viewName]: string } = {
      ENV_LOGS: 'Environment logs',
      ENV_SETTINGS: 'Environment settings'
    };

    await this.elementClick(
      `.header .btn[ngbTooltip="${selectors[viewName]}"]`
    );
  }

  public async switchTab(tabName: TabsNameType) {
    const selectors: { [key in typeof tabName]: string } = {
      RESPONSE:
        '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(1) .nav-link',
      HEADERS:
        '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(2) .nav-link',
      RULES:
        '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(3) .nav-link',
      SETTINGS:
        '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(4) .nav-link'
    };

    await this.elementClick(selectors[tabName]);
  }

  public async selectEnvironmentLogEntry(index: number) {
    await this.elementClick(
      `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${index})`
    );
  }

  public async assertEnvironmentLogEntryActive(index: number) {
    await this.waitElementExist(
      `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${index}) .nav-link.active`
    );
  }

  public async switchTabInEnvironmentLogs(
    tabName: EnvironmentLogsTabsNameType
  ) {
    const selectors: { [key in typeof tabName]: string } = {
      REQUEST:
        '.environment-logs-content .nav.nav-tabs .nav-item:nth-child(1) .nav-link',
      RESPONSE:
        '.environment-logs-content .nav.nav-tabs .nav-item:nth-child(2) .nav-link'
    };

    await this.elementClick(selectors[tabName]);
  }

  public async addResponseRule(rule: ResponseRule) {
    await this.elementClick('app-route-response-rules .btn.btn-link');
    await this.selectByAttribute(
      'app-route-response-rules .rule-item:last-of-type .form-inline select[formcontrolname="target"]',
      'value',
      rule.target
    );
    await this.setElementValue(
      'app-route-response-rules .rule-item:last-of-type .form-inline input[formcontrolname="modifier"]',
      rule.modifier
    );
    await this.setElementValue(
      'app-route-response-rules .rule-item:last-of-type .form-inline input[formcontrolname="value"]',
      rule.value
    );
  }

  public async httpCallAsserterWithPort(httpCall: HttpCall, port: number) {
    return await this.httpCallAssertWithPortAndHostname(
      httpCall,
      port,
      'localhost'
    );
  }

  public async httpCallAssertWithPortAndHostname(
    httpCall: HttpCall,
    port: number,
    hostname: string
  ) {
    // allow for UI changes to be propagated
    await this.testsInstance.app.client.pause(500);

    const response = await fetch({
      hostname,
      protocol: httpCall.protocol || 'http',
      port,
      path: httpCall.path,
      method: httpCall.method,
      headers: httpCall.headers,
      body: httpCall.body,
      cookie: httpCall.cookie
    });

    if (httpCall.testedResponse) {
      Object.keys(httpCall.testedResponse).forEach((propertyName) => {
        if (propertyName === 'headers') {
          Object.keys(httpCall.testedResponse.headers).forEach((headerName) => {
            const responseHeader = response.headers[headerName];

            if (Array.isArray(httpCall.testedResponse.headers[headerName])) {
              (httpCall.testedResponse.headers[headerName] as string[]).forEach(
                (expectedHeader) => {
                  expect(responseHeader)
                    .to.be.be.an('Array')
                    .that.include(expectedHeader);
                }
              );
            } else {
              expect(responseHeader).to.not.be.undefined;
              expect(responseHeader).to.include(
                httpCall.testedResponse.headers[headerName]
              );
            }
          });
        } else if (
          propertyName === 'body' &&
          httpCall.testedResponse.body instanceof RegExp
        ) {
          expect(response.body).to.match(httpCall.testedResponse.body);
        } else if (
          propertyName === 'body' &&
          typeof httpCall.testedResponse.body === 'object'
        ) {
          expect(response.body).to.have.string(
            (httpCall.testedResponse.body as { contains: string }).contains
          );
        } else {
          expect(response[propertyName]).to.equal(
            httpCall.testedResponse[propertyName]
          );
        }
      });
    } else {
      return response;
    }
  }

  public async httpCallAsserter(httpCall: HttpCall) {
    return await this.httpCallAsserterWithPort(httpCall, 3000);
  }

  public async assertActiveEnvironmentPort(expectedPort: number) {
    const port: string = await this.getElementAttribute(
      'input[formcontrolname="port"]',
      'value'
    );
    port.should.be.equals(expectedPort.toString());
  }

  public async assertActiveEnvironmentName(expectedName: string) {
    const environmentName: string = await this.getElementAttribute(
      'input[formcontrolname="name"]',
      'value'
    );
    environmentName.should.be.equals(expectedName.toString());
  }

  public async openSettingsModal() {
    this.selectMenuEntry('OPEN_SETTINGS');
    await this.waitElementExist('.modal-dialog');
  }

  public mockSaveDialog(filePath: string) {
    this.testsInstance.ipcRenderer.sendSync('SPECTRON_FAKE_DIALOG', {
      method: 'showSaveDialog',
      value: { filePath }
    });
  }

  public mockOpenDialog(filePath: string[]) {
    this.testsInstance.ipcRenderer.sendSync('SPECTRON_FAKE_DIALOG', {
      method: 'showOpenDialog',
      value: { filePaths: filePath }
    });
  }

  public selectMenuEntry(actionName: string) {
    this.testsInstance.app.webContents.send('APP_MENU', actionName);
  }

  public async closeModal() {
    await this.elementClick('.modal-dialog .modal-footer button');
  }

  public async assertViewBodyLogButtonPresence(inverted = false) {
    await this.waitElementExist('.view-body-link', inverted);
  }

  public async clickViewBodyLogButton() {
    await this.elementClick('.view-body-link');
  }

  public async assertPresenceOnLogsPage() {
    await this.waitElementExist('.environment-logs');
  }

  public async assertLogsEmpty() {
    const messageText = await this.getElementText(
      '.environment-logs-column:nth-child(2) .message'
    );
    expect(messageText).to.equal('No records yet');
  }

  public async assertNoLogEntrySelected() {
    const messageText = await this.getElementText(
      '.environment-logs-column:nth-child(2) .message'
    );
    expect(messageText).to.equal('Please select a record');
  }

  public async environmentLogBodyContains(str: string) {
    const elementText = await this.getElementText(
      'div.environment-logs-content-item.pre'
    );
    expect(elementText).to.equal(str);
  }

  public async clearEnvironmentLogs() {
    await this.switchViewInHeader('ENV_LOGS');
    const selector =
      '.main-content > div:first-of-type .btn.btn-link.btn-icon:last-of-type';
    // click twice to confirm (cannot double click)
    await this.elementClick(selector);
    await this.elementClick(selector);
  }

  /**
   * Assert text in environment logs
   *
   * @param text
   * @param tab
   * @param sectionIndex - includes the titles (General, Headers, etc)
   * @param itemIndex
   */
  public async environmentLogItemEqual(
    text: string,
    tab: 'request' | 'response',
    sectionIndex: number,
    itemIndex: number
  ) {
    const selector = `.environment-logs-content-${tab} div:nth-child(${sectionIndex}) div.environment-logs-content-item:nth-child(${itemIndex})`;

    await this.waitElementExist(selector);
    const elementText = await this.getElementText(selector);
    expect(elementText).to.equal(text);
  }

  /**
   * Assert text in environment logs item title
   *
   * @param text
   * @param tab
   * @param sectionIndex - includes the titles (General, Headers, etc)
   * @param itemIndex
   */
  public async environmentLogItemTitleEqual(
    text: string,
    tab: 'request' | 'response',
    sectionIndex: number
  ) {
    const selector = `.environment-logs-content-${tab} div:nth-child(${sectionIndex}) div:first-child`;

    await this.waitElementExist(selector);
    const elementText = await this.getElementText(selector);
    expect(elementText).to.contains(text);
  }

  public async environmentLogMenuMethodEqual(method: string, logIndex: number) {
    const selector = `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .nav-link .route-method`;

    await this.waitElementExist(selector);
    const methodText = await this.getElementText(selector);
    expect(methodText).to.equals(method);
  }

  public async environmentLogMenuPathEqual(method: string, logIndex: number) {
    const selector = `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .nav-link .route`;

    await this.waitElementExist(selector);
    const elementText = await this.getElementText(selector);
    expect(elementText).to.equals(method);
  }

  public async environmentLogMenuCheckIcon(
    icon: 'PROXY' | 'CAUGHT',
    logIndex: number,
    inverted = false
  ) {
    await this.waitElementExist(
      `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .nav-link i[ngbTooltip="${
        icon === 'PROXY' ? 'Request proxied' : 'Request caught'
      }"]`,
      inverted
    );
  }

  public async environmentLogClickMockButton(logIndex: number) {
    await this.elementClick(
      `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .btn-mock`
    );
  }

  public async disableRoute() {
    await this.contextMenuClick(
      '.routes-menu .menu-list .nav-item .nav-link.active',
      4
    );
  }

  /**
   * Wait for data autosave
   */
  public async waitForAutosave() {
    await this.testsInstance.app.client.pause(2500);
  }

  public async verifyObjectPropertyInFile(
    filePath: string,
    objectPaths: string | string[],
    values: any | any[],
    exists = false
  ) {
    const environmentFile = await fs.readFile(filePath);
    const environments: Environments = JSON.parse(environmentFile.toString());

    this.verifyObjectProperty(environments, objectPaths, values, exists);
  }

  public verifyObjectProperty(
    object: any,
    objectPaths: string | string[],
    values: any | any[],
    exists = false
  ) {
    objectPaths = Array.isArray(objectPaths) ? objectPaths : [objectPaths];
    values = Array.isArray(values) ? values : [values];

    for (let index = 0; index < objectPaths.length; index++) {
      if (exists) {
        expect(objectGetPath(object, objectPaths[index])).to.exist;
      } else {
        expect(objectGetPath(object, objectPaths[index])).to.equal(
          values[index]
        );
      }
    }
  }

  public async addHeader(
    location:
      | 'route-response-headers'
      | 'environment-headers'
      | 'proxy-req-headers'
      | 'proxy-res-headers',
    header: Header
  ) {
    const headersComponentSelector = `app-headers-list#${location}`;
    const inputsSelector = `${headersComponentSelector} .headers-list:last-of-type input:nth-of-type`;

    await this.elementClick(`${headersComponentSelector} button`);
    await this.setElementValue(`${inputsSelector}(1)`, header.key);
    await this.setElementValue(`${inputsSelector}(2)`, header.value);
  }

  /**
   * Return chosen headers list key values as an object
   *
   * @param location
   */
  public async getHeadersValues(
    location:
      | 'route-response-headers'
      | 'environment-headers'
      | 'proxy-req-headers'
      | 'proxy-res-headers'
  ) {
    const keyInputs = await this.testsInstance.app.client.$$(
      `app-headers-list#${location} .headers-list input:first-of-type`
    );
    const valueInputs = await this.testsInstance.app.client.$$(
      `app-headers-list#${location} .headers-list input:last-of-type`
    );
    const headers = {};

    for (let index = 0; index < keyInputs.length; index++) {
      const key = (await keyInputs[index].getValue()).toLowerCase();
      const value = (await valueInputs[index].getValue()).toLowerCase();

      headers[key] = value;
    }

    return headers;
  }

  public async toggleDisableTemplating() {
    await this.elementClick("label[for='disableTemplating']");
  }

  public async assertRulesOperatorPresence(inverted = false) {
    await this.waitElementExist('.rules-operator', inverted);
  }

  public async assertRulesOperator(operator: LogicalOperators) {
    const element = await this.getElement(
      `.rules-operator input[id="rulesOperators${operator}"]`
    );
    const selected: boolean = await element.isSelected();
    expect(selected).to.equals(true);
  }

  public async selectRulesOperator(operator: LogicalOperators) {
    await this.elementClick(`.rules-operator .rules-operator-${operator}`);
  }

  public async openDropdown(dropdownId: string) {
    await this.elementClick(`#${dropdownId}-dropdown`);
  }

  public async selectDropdownItem(dropdownId: string, index: number) {
    await this.elementClick(
      `#${dropdownId}-dropdown-menu .dropdown-menu-content button:nth-of-type(${index})`
    );
  }

  public async setDropdownInputValue(dropdownId: string, value: string) {
    await this.setElementValue(
      `#${dropdownId}-dropdown-menu .form-control`,
      value
    );
  }

  public async assertDropdownItemsNumber(
    dropdownId: string,
    expectedNumber: number
  ) {
    await this.countElements(
      `#${dropdownId}-dropdown-menu .dropdown-menu-content button`,
      expectedNumber
    );
  }

  public async assertDropdownItemText(
    dropdownId: string,
    itemIndex: number,
    expectedText: string
  ) {
    await this.assertElementText(
      `#${dropdownId}-dropdown-menu .dropdown-menu-content button:nth-of-type(${itemIndex})`,
      expectedText
    );
  }

  public async assertDropdownToggleText(
    dropdownId: string,
    expectedText: string
  ) {
    await this.assertElementText(
      `#${dropdownId}-dropdown .dropdown-toggle`,
      expectedText
    );
  }
}
