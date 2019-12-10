import { TabsNameType, ViewsNameType, EnvironmentLogsTabsNameType } from 'src/app/stores/store';
import { ResponseRule } from 'src/app/types/route.type';
import { HttpCall } from 'test/lib/types';
import { fetch } from './fetch';
import { Tests } from './tests';

export class Helpers {
  constructor(private testsInstance: Tests) { }

  async addEnvironment() {
    await this.testsInstance.spectron.client.element('.menu-column--environments .nav:first-of-type .nav-item .nav-link').click();
  }

  async addRoute() {
    await this.testsInstance.spectron.client.element('.menu-column--routes .nav:first-of-type .nav-item .nav-link').click();
  }

  async addRouteResponse() {
    await this.testsInstance.spectron.client.element('#route-responses-menu .btn-group .btn-custom').click();
  }

  async removeRouteResponse() {
    const deleteButtonSelector = '#route-responses-menu .btn-link:not(.doc-link)';

    await this.testsInstance.spectron.client.element(deleteButtonSelector).click();
    await this.testsInstance.spectron.client.element(deleteButtonSelector).click();
  }

  async countEnvironments(expected: number) {
    await this.testsInstance.spectron.client.elements('.menu-column--environments .menu-list .nav-item').should.eventually.have.property('value').to.be.an('Array').that.have.lengthOf(expected);
  }

  async countRoutes(expected: number) {
    await this.testsInstance.spectron.client.elements('.menu-column--routes .menu-list .nav-item').should.eventually.have.property('value').to.be.an('Array').that.have.lengthOf(expected);
  }

  async countRouteResponses(expected: number) {
    await this.testsInstance.spectron.client.elements('#route-responses-menu .dropdown-menu .dropdown-item')
      .should.eventually.have.property('value').to.be.an('Array').that.have.lengthOf(expected);
  }

  async countEnvironmentLogsEntries(expected: number) {
    await this.testsInstance.spectron.client.elements('.environment-logs-column:nth-child(1) .menu-list .nav-item')
      .should.eventually.have.property('value').to.be.an('Array').that.have.lengthOf(expected);
  }

  async contextMenuClick(targetMenuItemSelector: string, contextMenuItemIndex: number) {
    await this.testsInstance.spectron.client.element(targetMenuItemSelector).rightClick();

    await this.testsInstance.spectron.client.element(`.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`).click();
  }

  async contextMenuClickAndConfirm(targetMenuItemSelector: string, contextMenuItemIndex: number) {
    await this.testsInstance.spectron.client.element(targetMenuItemSelector).rightClick();

    // click twice to confirm (cannot double click)
    await this.testsInstance.spectron.client.element(`.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`).click();
    await this.testsInstance.spectron.client.element(`.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`).click();
  }

  async startEnvironment() {
    await this.testsInstance.spectron.client.element('.btn i[ngbtooltip="Start server"]').click();
    await this.testsInstance.spectron.client.waitForExist(`.menu-column--environments .menu-list .nav-item .nav-link.active.running`);
  }

  async stopEnvironment() {
    await this.testsInstance.spectron.client.element('.btn i[ngbtooltip="Stop server"]').click();
    await this.testsInstance.spectron.client.waitForExist(`.menu-column--environments .menu-list .nav-item .nav-link.active.running`, 1000, true);
  }

  async restartEnvironment() {
    await this.testsInstance.spectron.client.element('.btn i[ngbtooltip="Server needs restart"]').click();
    await this.testsInstance.spectron.client.waitForExist(`.menu-column--environments .menu-list .nav-item .nav-link.active.running`);
  }

  async checkEnvironmentNeedsRestart() {
    await this.testsInstance.spectron.client.waitForExist(`.menu-column--environments .menu-list .nav-item .nav-link.active.need-restart`);
  }

  async selectEnvironment(index: number)  {
    await this.testsInstance.spectron.client.element(`.menu-column--environments .menu-list .nav-item:nth-child(${index}) .nav-link`).click();
  }

  async setRouteStatusCode(statusCode: string) {
    await this.testsInstance.spectron.client.element('select[formcontrolname="statusCode"]').setValue(statusCode);
  }

  async selectRoute(index: number) {
    await this.testsInstance.spectron.client.element(`.menu-column--routes .nav.menu-list .nav-item:nth-child(${index})`).click();
  }

  async selectRouteResponse(index: number) {
    await this.testsInstance.spectron.client.element('#route-responses-menu .dropdown-toggle').click();
    await this.testsInstance.spectron.client.element(`#route-responses-menu .dropdown-menu .dropdown-item:nth-child(${index})`).click();
  }

  async switchViewInHeader(viewName: Exclude<ViewsNameType, 'ROUTE'>) {
    const selectors: { [key in typeof viewName]: string } = {
      ENV_LOGS: 'Environment logs',
      ENV_SETTINGS: 'Environment settings'
    };

    await this.testsInstance.spectron.client.element(`.header .btn[ngbTooltip="${selectors[viewName]}"]`).click();
  }

  async switchTab(tabName: TabsNameType) {
    const selectors: { [key in typeof tabName]: string } = {
      RESPONSE: '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(1) .nav-link',
      HEADERS: '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(2) .nav-link',
      RULES: '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(3) .nav-link'
    };

    await this.testsInstance.spectron.client.element(selectors[tabName]).click();
  }

  async switchTabInEnvironmentLogs(tabName: EnvironmentLogsTabsNameType) {
    const selectors: { [key in typeof tabName]: string } = {
      REQUEST: '.environment-logs-content .nav.nav-tabs .nav-item:nth-child(1) .nav-link',
      RESPONSE: '.environment-logs-content .nav.nav-tabs .nav-item:nth-child(2) .nav-link'
    };

    await this.testsInstance.spectron.client.element(selectors[tabName]).click();
  }

  async addResponseRule(rule: ResponseRule) {
    await this.testsInstance.spectron.client.element('app-route-response-rules .btn.btn-link').click();
    await this.testsInstance.spectron.client.element('app-route-response-rules .row:last-of-type .form-inline select[formcontrolname="target"]').selectByValue(rule.target);
    await this.testsInstance.spectron.client.element('app-route-response-rules .row:last-of-type .form-inline input[formcontrolname="modifier"]').setValue(rule.modifier);
    await this.testsInstance.spectron.client.element('app-route-response-rules .row:last-of-type .form-inline input[formcontrolname="value"]').setValue(rule.value);
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
      Object.keys(httpCall.testedProperties).reduce((propertiesToTest, propertyName) => {
        return { ...propertiesToTest, [propertyName]: httpCall.testedProperties[propertyName] };
      }, {})
    );
  }

  async httpCallAsserter(httpCall: HttpCall) {
    await this.httpCallAsserterWithPort(httpCall, 3000);
  }

  async assertActiveEnvironmentPort(expectedPort: number) {
    const port: String = await this.testsInstance.spectron.client.element('input[formcontrolname="port"]').getAttribute('value');
    await port.should.be.equals(expectedPort.toString());
  }

  async openSettingsModal() {
    await this.testsInstance.spectron.webContents.send('keydown', { action: 'OPEN_SETTINGS' });
    await this.testsInstance.spectron.client.waitForExist(`.modal-dialog`);
  }

  async closeSettingsModal() {
    await this.testsInstance.spectron.client.element(`.modal-dialog .modal-footer button`).click();
  }

  async requestLogBodyContains(str: string) {
    await this.testsInstance.spectron.client.element(`div.environment-logs-content-title:nth-child(9)`).click();
    await this.testsInstance.spectron.client.element(`div.environment-logs-content-item.pre`).getHTML().should.eventually.contain(str);
  }

  async disableRoute() {
    await this.contextMenuClick('.menu-column--routes .menu-list .nav-item .nav-link.active', 4);
  }
}
