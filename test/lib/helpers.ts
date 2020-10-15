import { expect } from 'chai';
import { promises as fs } from 'fs';
import { get as objectGetPath } from 'object-path';
import { ToastTypes } from 'src/app/models/toasts.model';
import {
  EnvironmentLogsTabsNameType,
  TabsNameType,
  ViewsNameType
} from 'src/app/stores/store';
import { Environments } from 'src/app/types/environment.type';
import {
  Header,
  LogicalOperators,
  ResponseRule
} from 'src/app/types/route.type';
import { fetch } from 'test/lib/fetch';
import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

export class Helpers {
  constructor(private testsInstance: Tests) {}

  async getElement(selector: string) {
    const element = await this.testsInstance.app.client.$(selector);

    return element;
  }

  async waitElementExist(selector: string, reverse: boolean = false) {
    const element = await this.getElement(selector);
    await element.waitForExist({ reverse });
  }

  async elementClick(selector: string, button: 'left' | 'right' = 'left') {
    const element = await this.getElement(selector);
    await element.click({ button });
  }

  async setElementValue(selector: string, value: string | number | boolean) {
    const element = await this.getElement(selector);
    await element.setValue(value);
  }

  async selectByAttribute(selector: string, attribute: string, value: string) {
    const element = await this.getElement(selector);
    await element.selectByAttribute(attribute, value);
  }

  async getElementText(selector: string) {
    const element = await this.getElement(selector);
    const elementText = await element.getText();

    return elementText;
  }

  async getElementAttribute(selector: string, attribute: string) {
    const element = await this.getElement(selector);
    const elementAttribute = await element.getAttribute(attribute);

    return elementAttribute;
  }

  async countElements(selector: string, expected: number) {
    await this.testsInstance.app.client
      .$$(selector)
      .should.eventually.be.an('Array')
      .that.have.lengthOf(expected);
  }

  async addEnvironment() {
    await this.elementClick(
      '.environments-menu .nav:first-of-type .nav-item .nav-link.add-environment'
    );
  }

  async removeEnvironment(index: number) {
    await this.contextMenuClickAndConfirm(
      `.environments-menu .menu-list .nav-item:nth-child(${index}) .nav-link`,
      5
    );
  }

  async addRoute() {
    await this.elementClick(
      '.routes-menu .nav:first-of-type .nav-item .nav-link'
    );
  }

  async addRouteResponse() {
    await this.elementClick('#route-responses-menu .btn-group .btn-custom');
  }

  async removeRouteResponse() {
    const deleteButtonSelector =
      '#route-responses-menu #route-response-removal-button';

    await this.elementClick(deleteButtonSelector);
    await this.elementClick(deleteButtonSelector);
  }

  async duplicateRouteResponse() {
    const duplicationButtonSelector =
      '#route-responses-menu #route-response-duplication-button';
    await this.elementClick(duplicationButtonSelector);
  }

  async countEnvironments(expected: number) {
    await this.countElements(
      '.environments-menu .menu-list .nav-item',
      expected
    );
  }

  async countRoutes(expected: number) {
    await this.countElements('.routes-menu .menu-list .nav-item', expected);
  }

  async countRouteResponses(expected: number) {
    await this.countElements(
      '#route-responses-menu .dropdown-menu .dropdown-item',
      expected
    );
  }

  async countEnvironmentLogsEntries(expected: number) {
    await this.countElements(
      '.environment-logs-column:nth-child(1) .menu-list .nav-item',
      expected
    );
  }

  async toggleEnvironmentMenu() {
    await this.elementClick(
      '.environments-menu .nav:first-of-type .nav-item .nav-link.toggle-environments-menu'
    );
    // wait for environment menu to open/close
    await this.testsInstance.app.client.pause(310);
  }

  async contextMenuOpen(targetMenuItemSelector: string) {
    await this.elementClick(targetMenuItemSelector, 'right');
  }

  async contextMenuClick(
    targetMenuItemSelector: string,
    contextMenuItemIndex: number
  ) {
    await this.elementClick(targetMenuItemSelector, 'right');
    await this.elementClick(
      `.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`
    );
  }

  async contextMenuClickAndConfirm(
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

  async startEnvironment() {
    await this.elementClick('.btn i[ngbtooltip="Start server"]');
    await this.waitElementExist(
      `.environments-menu .menu-list .nav-item .nav-link.active.running`
    );
  }

  async stopEnvironment() {
    await this.elementClick('.btn i[ngbtooltip="Stop server"]');
    await this.waitElementExist(
      `.environments-menu .menu-list .nav-item .nav-link.active.running`,
      true
    );
  }

  async restartEnvironment() {
    await this.elementClick('.btn i[ngbtooltip="Server needs restart"]');
    await this.waitElementExist(
      `.environments-menu .menu-list .nav-item .nav-link.active.running`
    );
  }

  async assertEnvironmentServerIconsExists(
    index: number,
    iconName: 'cors' | 'https' | 'proxy-mode'
  ) {
    const selector = `.environments-menu .nav-item:nth-child(${index}) .nav-link.active .server-icons-${iconName}`;
    await this.waitElementExist(selector);
  }

  async assertHasActiveEnvironment(name?: string, reverse = false) {
    const selector = '.environments-menu .nav-item .nav-link.active';
    await this.waitElementExist(selector, reverse);

    if (name) {
      const text = await this.getElementText(selector + ' > div:first-of-type');
      expect(text).to.equal(name);
    }
  }

  async checkEnvironmentNeedsRestart() {
    await this.waitElementExist(
      `.environments-menu .menu-list .nav-item .nav-link.active.need-restart`
    );
  }

  async checkEnvironmentSelected(index: number) {
    await this.waitElementExist(
      `.environments-menu .menu-list .nav-item:nth-child(${index}) .nav-link.active`
    );
  }

  async checkNoEnvironmentSelected() {
    await this.waitElementExist(
      `.environments-menu .menu-list .nav-item .nav-link.active`,
      true
    );
  }

  async selectEnvironment(index: number) {
    await this.elementClick(
      `.environments-menu .menu-list .nav-item:nth-child(${index}) .nav-link`
    );
  }

  async checkActiveRoute(name?: string, reverse = false) {
    const selector = '.routes-menu .nav-item .nav-link.active';
    await this.waitElementExist(selector, reverse);

    if (name) {
      const text = await this.getElementText(selector + ' > div:first-of-type');
      expect(text).to.equal(name);
    }
  }

  async selectRoute(index: number) {
    await this.elementClick(
      `.routes-menu .nav.menu-list .nav-item:nth-child(${index})`
    );
  }

  async selectRouteResponse(index: number) {
    await this.elementClick('#route-responses-menu .dropdown-toggle');
    await this.elementClick(
      `#route-responses-menu .dropdown-menu .dropdown-item:nth-child(${index})`
    );
  }

  async checkToastDisplayed(toastType: ToastTypes, text: string) {
    const toastSelector = `.toast.toast-${toastType}`;

    await this.waitElementExist(toastSelector);

    if (text) {
      const elementText = await this.getElementText(
        `${toastSelector} .toast-body`
      );
      expect(elementText).to.contain(text);
    }
  }

  async switchViewInHeader(viewName: Exclude<ViewsNameType, 'ROUTE'>) {
    const selectors: { [key in typeof viewName]: string } = {
      ENV_LOGS: 'Environment logs',
      ENV_SETTINGS: 'Environment settings'
    };

    await this.elementClick(
      `.header .btn[ngbTooltip="${selectors[viewName]}"]`
    );
  }

  async switchTab(tabName: TabsNameType) {
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

  async selectEnvironmentLogEntry(index: number) {
    await this.elementClick(
      `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${index})`
    );
  }

  async assertEnvironmentLogEntryActive(index: number) {
    await this.waitElementExist(
      `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${index}) .nav-link.active`
    );
  }

  async switchTabInEnvironmentLogs(tabName: EnvironmentLogsTabsNameType) {
    const selectors: { [key in typeof tabName]: string } = {
      REQUEST:
        '.environment-logs-content .nav.nav-tabs .nav-item:nth-child(1) .nav-link',
      RESPONSE:
        '.environment-logs-content .nav.nav-tabs .nav-item:nth-child(2) .nav-link'
    };

    await this.elementClick(selectors[tabName]);
  }

  async addResponseRule(rule: ResponseRule) {
    await this.elementClick('app-route-response-rules .btn.btn-link');
    await this.selectByAttribute(
      'app-route-response-rules .row:last-of-type .form-inline select[formcontrolname="target"]',
      'value',
      rule.target
    );
    await this.setElementValue(
      'app-route-response-rules .row:last-of-type .form-inline input[formcontrolname="modifier"]',
      rule.modifier
    );
    await this.setElementValue(
      'app-route-response-rules .row:last-of-type .form-inline input[formcontrolname="value"]',
      rule.value
    );
  }

  async httpCallAsserterWithPort(httpCall: HttpCall, port: number) {
    const response = await fetch({
      protocol: 'http',
      port: port,
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

            expect(responseHeader).to.not.be.undefined;
            expect(responseHeader).to.include(
              httpCall.testedResponse.headers[headerName]
            );
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

  async httpCallAsserter(httpCall: HttpCall) {
    await this.testsInstance.app.client.pause(100);
    await this.httpCallAsserterWithPort(httpCall, 3000);
  }

  async assertElementValue(selector: string, valueToCompare: string) {
    const element = await this.getElement(selector);
    expect(await element.getValue()).to.equal(valueToCompare);
  }

  async assertActiveEnvironmentPort(expectedPort: number) {
    const port: string = await this.getElementAttribute(
      'input[formcontrolname="port"]',
      'value'
    );
    await port.should.be.equals(expectedPort.toString());
  }

  async assertActiveEnvironmentName(expectedName: string) {
    const environmentName: string = await this.getElementAttribute(
      'input[formcontrolname="name"]',
      'value'
    );
    await environmentName.should.be.equals(expectedName.toString());
  }

  async openSettingsModal() {
    await this.sendWebContentsAction('OPEN_SETTINGS');
    await this.waitElementExist(`.modal-dialog`);
  }

  sendWebContentsAction(actionName: string) {
    this.testsInstance.app.webContents.send('keydown', {
      action: actionName
    });
  }

  async closeModal() {
    await this.elementClick(`.modal-dialog .modal-footer button`);
  }

  async assertViewBodyLogButtonPresence(inverted = false) {
    await this.waitElementExist('.view-body-link', inverted);
  }

  async clickViewBodyLogButton() {
    await this.elementClick('.view-body-link');
  }

  async assertPresenceOnLogsPage() {
    await this.waitElementExist('.environment-logs');
  }

  async assertLogsEmpty() {
    const messageText = await this.getElementText(
      '.environment-logs-column:nth-child(2) .message'
    );
    expect(messageText).to.equal('No records yet');
  }

  async assertNoLogEntrySelected() {
    const messageText = await this.getElementText(
      '.environment-logs-column:nth-child(2) .message'
    );
    expect(messageText).to.equal('Please select a record');
  }

  async environmentLogBodyContains(str: string) {
    const elementText = await this.getElementText(
      `div.environment-logs-content-item.pre`
    );
    expect(elementText).to.equal(str);
  }

  async clearEnvironmentLogs() {
    await this.switchViewInHeader('ENV_LOGS');
    const selector =
      '.main-content > .row >.col .btn.btn-link.btn-icon:last-of-type';
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
  async environmentLogItemEqual(
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

  async environmentLogMenuMethodEqual(method: string, logIndex: number) {
    const selector = `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .nav-link .route-method`;

    await this.waitElementExist(selector);
    const methodText = await this.getElementText(selector);
    expect(methodText).to.equals(method);
  }

  async environmentLogMenuPathEqual(method: string, logIndex: number) {
    const selector = `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .nav-link .route`;

    await this.waitElementExist(selector);
    const elementText = await this.getElementText(selector);
    expect(elementText).to.equals(method);
  }

  async environmentLogMenuCheckIcon(
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

  async environmentLogClickMockButton(logIndex: number) {
    await this.elementClick(
      `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .btn-mock`
    );
  }

  async disableRoute() {
    await this.contextMenuClick(
      '.routes-menu .menu-list .nav-item .nav-link.active',
      3
    );
  }

  /**
   * Wait for data autosave
   */
  async waitForAutosave() {
    await this.testsInstance.app.client.pause(2500);
  }

  async verifyObjectPropertyInFile(
    filePath: string,
    objectPaths: string | string[],
    values: any | any[],
    exists = false
  ) {
    const environmentFile = await fs.readFile(filePath);
    const environments: Environments = JSON.parse(environmentFile.toString());

    this.verifyObjectProperty(environments, objectPaths, values, exists);
  }

  verifyObjectProperty(
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

  async addHeader(
    location:
      | 'route-response-headers'
      | 'environment-headers'
      | 'proxy-req-headers'
      | 'proxy-res-headers',
    header: Header
  ) {
    const headersComponentSelector = `app-headers-list#${location}`;
    const inputsSelector = `${headersComponentSelector} .row.headers-list:last-of-type input:nth-of-type`;

    await this.elementClick(`${headersComponentSelector} button`);
    await this.setElementValue(`${inputsSelector}(1)`, header.key);
    await this.setElementValue(`${inputsSelector}(2)`, header.value);
  }

  async toggleDisableTemplating() {
    await this.elementClick("label[for='disableTemplating']");
  }

  async assertRulesOperatorPresence(inverted = false) {
    await this.waitElementExist('.rules-operator', inverted);
  }

  async assertRulesOperator(operator: LogicalOperators) {
    const element = await this.getElement(
      `.rules-operator input[id="rulesOperators${operator}"]`
    );
    const selected: boolean = await element.isSelected();
    expect(selected).to.equals(true);
  }

  async selectRulesOperator(operator: LogicalOperators) {
    await this.elementClick(`.rules-operator .rules-operator-${operator}`);
  }
}
