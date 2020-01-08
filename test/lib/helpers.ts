import { expect } from 'chai';
import { promises as fs } from 'fs';
import { get as objectGetPath } from 'object-path';
import { ToastTypes } from 'src/app/services/toasts.service';
import { EnvironmentLogsTabsNameType, TabsNameType, ViewsNameType } from 'src/app/stores/store';
import { Environments } from 'src/app/types/environment.type';
import { ResponseRule } from 'src/app/types/route.type';
import { HttpCall } from 'test/lib/types';
import { fetch } from './fetch';
import { Tests } from './tests';

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
      '#route-responses-menu .btn-link:not(.doc-link)';

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
      await this.testsInstance.app.client
        .getText(selector + ' > div:first-of-type')
        .should.eventually.equal(name);
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
      await this.testsInstance.app.client
        .getText(selector + ' > div:first-of-type')
        .should.eventually.equal(name);
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
      await this.testsInstance.app.client
        .getText(`${toastSelector} .toast-body`)
        .should.eventually.contain(text);
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
    await fetch({
      protocol: 'http',
      port: port,
      path: httpCall.path,
      method: httpCall.method,
      headers: httpCall.headers,
      body: httpCall.body
    }).should.eventually.deep.include(
      Object.keys(httpCall.testedProperties).reduce(
        (propertiesToTest, propertyName) => {
          return {
            ...propertiesToTest,
            [propertyName]: httpCall.testedProperties[propertyName]
          };
        },
        {}
      )
    );
  }

  async httpCallAsserter(httpCall: HttpCall) {
    await this.httpCallAsserterWithPort(httpCall, 3000);
  }

  async assertActiveEnvironmentPort(expectedPort: number) {
    const port: String = await this.testsInstance.app.client
      .element('input[formcontrolname="port"]')
      .getAttribute('value');
    await port.should.be.equals(expectedPort.toString());
  }

  async assertActiveEnvironmentName(expectedName: string) {
    const environmentName: String = await this.testsInstance.app.client
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

  async closeSettingsModal() {
    await this.testsInstance.app.client
      .element(`.modal-dialog .modal-footer button`)
      .click();
  }

  async requestLogBodyContains(str: string) {
    await this.testsInstance.app.client
      .element(`div.environment-logs-content-title:nth-child(9)`)
      .click();
    await this.testsInstance.app.client
      .element(`div.environment-logs-content-item.pre`)
      .getHTML()
      .should.eventually.contain(str);
  }

  async disableRoute() {
    await this.contextMenuClick(
      '.routes-menu .menu-list .nav-item .nav-link.active',
      3
    );
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

  async verifyObjectProperty(
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
}
