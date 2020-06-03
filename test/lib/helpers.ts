import { expect } from 'chai';
import { promises as fs } from 'fs';
import { get as objectGetPath } from 'object-path';
import { ToastTypes } from 'src/app/services/toasts.service';
import { EnvironmentLogsTabsNameType, TabsNameType, ViewsNameType } from 'src/app/stores/store';
import { Environments } from 'src/app/types/environment.type';
import { Header, ResponseRule } from 'src/app/types/route.type';
import { fetch } from 'test/lib/fetch';
import { HttpCall } from 'test/lib/models';
import { Tests } from 'test/lib/tests';

export class Helpers {
  constructor(private testsInstance: Tests) {}

  async addEnvironment() {
    await this.testsInstance.app.client
      .element(
        '.environments-menu .nav:first-of-type .nav-item .nav-link.add-environment'
      )
      .click();
  }

  async removeEnvironment(index: number) {
    await this.contextMenuClickAndConfirm(
      `.environments-menu .menu-list .nav-item:nth-child(${index}) .nav-link`,
      5
    );
  }

  async addRoute() {
    await this.testsInstance.app.client
      .element('.routes-menu .nav:first-of-type .nav-item .nav-link')
      .click();
  }

  async addRouteResponse() {
    await this.testsInstance.app.client
      .element('#route-responses-menu .btn-group .btn-custom')
      .click();
  }

  async removeRouteResponse() {
    const deleteButtonSelector =
      '#route-responses-menu .btn-link:not(.doc-link):not(#duplication-button)';

    await this.testsInstance.app.client.element(deleteButtonSelector).click();
    await this.testsInstance.app.client.element(deleteButtonSelector).click();
  }

  async countEnvironments(expected: number) {
    await this.testsInstance.app.client
      .elements('.environments-menu .menu-list .nav-item')
      .should.eventually.have.property('value')
      .to.be.an('Array')
      .that.have.lengthOf(expected);
  }

  async countRoutes(expected: number) {
    await this.testsInstance.app.client
      .elements('.routes-menu .menu-list .nav-item')
      .should.eventually.have.property('value')
      .to.be.an('Array')
      .that.have.lengthOf(expected);
  }

  async countRouteResponses(expected: number) {
    await this.testsInstance.app.client
      .elements('#route-responses-menu .dropdown-menu .dropdown-item')
      .should.eventually.have.property('value')
      .to.be.an('Array')
      .that.have.lengthOf(expected);
  }

  async countEnvironmentLogsEntries(expected: number) {
    await this.testsInstance.app.client
      .elements('.environment-logs-column:nth-child(1) .menu-list .nav-item')
      .should.eventually.have.property('value')
      .to.be.an('Array')
      .that.have.lengthOf(expected);
  }

  async toggleEnvironmentMenu() {
    await this.testsInstance.app.client
      .element(
        '.environments-menu .nav:first-of-type .nav-item .nav-link.toggle-environments-menu'
      )
      .click();
    // wait for environment menu to open/close
    await this.testsInstance.app.client.pause(310);
  }

  async contextMenuOpen(targetMenuItemSelector: string) {
    await this.testsInstance.app.client
      .element(targetMenuItemSelector)
      .rightClick();
  }

  async contextMenuClick(
    targetMenuItemSelector: string,
    contextMenuItemIndex: number
  ) {
    await this.testsInstance.app.client
      .element(targetMenuItemSelector)
      .rightClick();

    await this.testsInstance.app.client
      .element(
        `.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`
      )
      .click();
  }

  async contextMenuClickAndConfirm(
    targetMenuItemSelector: string,
    contextMenuItemIndex: number
  ) {
    await this.testsInstance.app.client
      .element(targetMenuItemSelector)
      .rightClick();

    // click twice to confirm (cannot double click)
    await this.testsInstance.app.client
      .element(
        `.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`
      )
      .click();
    await this.testsInstance.app.client
      .element(
        `.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`
      )
      .click();
  }

  async startEnvironment() {
    await this.testsInstance.app.client
      .element('.btn i[ngbtooltip="Start server"]')
      .click();
    await this.testsInstance.app.client.waitForExist(
      `.environments-menu .menu-list .nav-item .nav-link.active.running`
    );
  }

  async stopEnvironment() {
    await this.testsInstance.app.client
      .element('.btn i[ngbtooltip="Stop server"]')
      .click();
    await this.testsInstance.app.client.waitForExist(
      `.environments-menu .menu-list .nav-item .nav-link.active.running`,
      1000,
      true
    );
  }

  async restartEnvironment() {
    await this.testsInstance.app.client
      .element('.btn i[ngbtooltip="Server needs restart"]')
      .click();
    await this.testsInstance.app.client.waitForExist(
      `.environments-menu .menu-list .nav-item .nav-link.active.running`
    );
  }

  async assertEnvironmentServerIconsExists(
    index: number,
    iconName: 'cors' | 'https' | 'proxy-mode'
  ) {
    const selector = `.environments-menu .nav-item:nth-child(${index}) .nav-link.active .server-icons-${iconName}`;
    await this.testsInstance.app.client.waitForExist(selector);
  }

  async assertHasActiveEnvironment(name?: string, reverse = false) {
    const selector = '.environments-menu .nav-item .nav-link.active';
    await this.testsInstance.app.client.waitForExist(selector, 5000, reverse);

    if (name) {
      const text = await this.testsInstance.app.client.getText(
        selector + ' > div:first-of-type'
      );
      expect(text).to.equal(name);
    }
  }

  async checkEnvironmentNeedsRestart() {
    await this.testsInstance.app.client.waitForExist(
      `.environments-menu .menu-list .nav-item .nav-link.active.need-restart`
    );
  }

  async checkEnvironmentSelected(index: number) {
    await this.testsInstance.app.client.waitForExist(
      `.environments-menu .menu-list .nav-item:nth-child(${index}) .nav-link.active`
    );
  }

  async checkNoEnvironmentSelected() {
    await this.testsInstance.app.client.waitForExist(
      `.environments-menu .menu-list .nav-item .nav-link.active`,
      5000,
      true
    );
  }

  async selectEnvironment(index: number) {
    await this.testsInstance.app.client
      .element(
        `.environments-menu .menu-list .nav-item:nth-child(${index}) .nav-link`
      )
      .click();
  }

  async checkActiveRoute(name?: string, reverse = false) {
    const selector = '.routes-menu .nav-item .nav-link.active';
    await this.testsInstance.app.client.waitForExist(selector, 5000, reverse);

    if (name) {
      const text = await this.testsInstance.app.client.getText(
        selector + ' > div:first-of-type'
      );
      expect(text).to.equal(name);
    }
  }

  async setRouteStatusCode(statusCode: string) {
    await this.testsInstance.app.client
      .element('select[formcontrolname="statusCode"]')
      .setValue(statusCode);
  }

  async selectRoute(index: number) {
    await this.testsInstance.app.client
      .element(`.routes-menu .nav.menu-list .nav-item:nth-child(${index})`)
      .click();
  }

  async selectRouteResponse(index: number) {
    await this.testsInstance.app.client
      .element('#route-responses-menu .dropdown-toggle')
      .click();
    await this.testsInstance.app.client
      .element(
        `#route-responses-menu .dropdown-menu .dropdown-item:nth-child(${index})`
      )
      .click();
  }

  async checkToastDisplayed(toastType: ToastTypes, text: string) {
    const toastSelector = `.toast.toast-${toastType}`;

    await this.testsInstance.app.client.waitForExist(toastSelector);

    if (text) {
      const elementText = await this.testsInstance.app.client.getText(
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

    await this.testsInstance.app.client
      .element(`.header .btn[ngbTooltip="${selectors[viewName]}"]`)
      .click();
  }

  async switchTab(tabName: TabsNameType) {
    const selectors: { [key in typeof tabName]: string } = {
      RESPONSE:
        '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(1) .nav-link',
      HEADERS:
        '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(2) .nav-link',
      RULES:
        '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(3) .nav-link'
    };

    await this.testsInstance.app.client.element(selectors[tabName]).click();
  }

  async selectEnvironmentLogEntry(index: number) {
    await this.testsInstance.app.client
      .element(
        `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${index})`
      )
      .click();
  }

  async assertEnvironmentLogEntryActive(index: number) {
    await this.testsInstance.app.client.waitForExist(
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

    await this.testsInstance.app.client.element(selectors[tabName]).click();
  }

  async addResponseRule(rule: ResponseRule) {
    await this.testsInstance.app.client
      .element('app-route-response-rules .btn.btn-link')
      .click();
    await this.testsInstance.app.client
      .element(
        'app-route-response-rules .row:last-of-type .form-inline select[formcontrolname="target"]'
      )
      .selectByValue(rule.target);
    await this.testsInstance.app.client
      .element(
        'app-route-response-rules .row:last-of-type .form-inline input[formcontrolname="modifier"]'
      )
      .setValue(rule.modifier);
    await this.testsInstance.app.client
      .element(
        'app-route-response-rules .row:last-of-type .form-inline input[formcontrolname="value"]'
      )
      .setValue(rule.value);
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
          expect(response[propertyName]).to.include(
            httpCall.testedResponse[propertyName]
          );
        } else if (
          propertyName === 'body' &&
          typeof httpCall.testedResponse[propertyName] === 'object'
        ) {
          expect(response[propertyName]).to.have.string(
            (httpCall.testedResponse[propertyName] as { contains: string })
              .contains
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

  async assertActiveEnvironmentPort(expectedPort: number) {
    const port: string = await this.testsInstance.app.client
      .element('input[formcontrolname="port"]')
      .getAttribute('value');
    await port.should.be.equals(expectedPort.toString());
  }

  async assertActiveEnvironmentName(expectedName: string) {
    const environmentName: string = await this.testsInstance.app.client
      .element('input[formcontrolname="name"]')
      .getAttribute('value');
    await environmentName.should.be.equals(expectedName.toString());
  }

  async openSettingsModal() {
    await this.sendWebContentsAction('OPEN_SETTINGS');
    await this.testsInstance.app.client.waitForExist(`.modal-dialog`);
  }

  sendWebContentsAction(actionName: string) {
    this.testsInstance.app.webContents.send('keydown', {
      action: actionName
    });
  }

  async closeModal() {
    await this.testsInstance.app.client
      .element(`.modal-dialog .modal-footer button`)
      .click();
  }

  async assertViewBodyLogButtonPresence(inverted = false) {
    await this.testsInstance.app.client.waitForExist(
      '.view-body-link',
      5000,
      inverted
    );
  }

  async clickViewBodyLogButton() {
    await this.testsInstance.app.client.element('.view-body-link').click();
  }

  async assertPresenceOnLogsPage() {
    await this.testsInstance.app.client.waitForExist('.environment-logs');
  }

  async assertLogsEmpty() {
    const messageText = await this.testsInstance.app.client.getText(
      '.environment-logs-column:nth-child(2) .message'
    );
    expect(messageText).to.equal('No records yet');
  }

  async assertNoLogEntrySelected() {
    const messageText = await this.testsInstance.app.client.getText(
      '.environment-logs-column:nth-child(2) .message'
    );
    expect(messageText).to.equal('Please select a record');
  }

  async environmentLogBodyContains(str: string) {
    const elementText = await this.testsInstance.app.client
      .element(`div.environment-logs-content-item.pre`)
      .getText();
    expect(elementText).to.equal(str);
  }

  async clearEnvironmentLogs() {
    await this.switchViewInHeader('ENV_LOGS');
    const selector =
      '.main-content > .row >.col .btn.btn-link.btn-icon:last-of-type';
    // click twice to confirm (cannot double click)
    await this.testsInstance.app.client.element(selector).click();
    await this.testsInstance.app.client.element(selector).click();
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

    await this.testsInstance.app.client.waitForExist(selector);
    const elementText = await this.testsInstance.app.client.getText(selector);
    expect(elementText).to.equal(text);
  }

  async environmentLogMenuMethodEqual(method: string, logIndex: number) {
    const selector = `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .nav-link .route-method`;

    await this.testsInstance.app.client.waitForExist(selector);
    const methodText = await this.testsInstance.app.client.getText(selector);
    expect(methodText).to.equals(method);
  }

  async environmentLogMenuPathEqual(method: string, logIndex: number) {
    const selector = `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .nav-link .route`;

    await this.testsInstance.app.client.waitForExist(selector);
    const elementText = await this.testsInstance.app.client.getText(selector);
    expect(elementText).to.equals(method);
  }

  async environmentLogMenuCheckIcon(
    icon: 'PROXY' | 'CAUGHT',
    logIndex: number,
    inverted = false
  ) {
    await this.testsInstance.app.client.waitForExist(
      `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .nav-link i[ngbTooltip="${
        icon === 'PROXY' ? 'Request proxied' : 'Request caught'
      }"]`,
      5000,
      inverted
    );
  }

  async environmentLogClickMockButton(logIndex: number) {
    await this.testsInstance.app.client
      .element(
        `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .btn-mock`
      )
      .click();
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

    await this.testsInstance.app.client
      .element(`${headersComponentSelector} button`)
      .click();
    await this.testsInstance.app.client
      .element(`${inputsSelector}(1)`)
      .setValue(header.key);
    await this.testsInstance.app.client
      .element(`${inputsSelector}(2)`)
      .setValue(header.value);
  }
}
