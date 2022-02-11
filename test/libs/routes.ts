import { LogicalOperators, ResponseRule } from '@mockoon/commons';
import { ChainablePromiseElement } from 'webdriverio';
import { TabsNameType } from '../../src/renderer/app/models/store.model';
import contextMenu from '../libs/context-menu';
import utils from '../libs/utils';

class Routes {
  private activeMenuEntrySelector = '.routes-menu .nav-item .nav-link.active';

  public get documentationInput(): ChainablePromiseElement<
    Promise<WebdriverIO.Element>
  > {
    return $('app-environment-routes input[formcontrolname="documentation"]');
  }

  public get pathInput(): ChainablePromiseElement<
    Promise<WebdriverIO.Element>
  > {
    return $('app-environment-routes input[formcontrolname="endpoint"]');
  }

  public get fileInput(): ChainablePromiseElement<
    Promise<WebdriverIO.Element>
  > {
    return $('app-environment-routes input[formcontrolname="filePath"]');
  }

  public get filter(): ChainablePromiseElement<Promise<WebdriverIO.Element>> {
    return $('input[id="route-filter"]');
  }

  private get addBtn(): ChainablePromiseElement<Promise<WebdriverIO.Element>> {
    return $('.routes-menu .nav:first-of-type .nav-item .nav-link');
  }

  public get bodyEditor(): ChainablePromiseElement<
    Promise<WebdriverIO.Element>
  > {
    return $('.ace_content');
  }

  private get activeMenuEntry(): ChainablePromiseElement<
    Promise<WebdriverIO.Element>
  > {
    return $(this.activeMenuEntrySelector);
  }

  public get rulesTab(): ChainablePromiseElement<Promise<WebdriverIO.Element>> {
    return $('#route-responses-menu .nav.nav-tabs .nav-item:nth-child(3)');
  }

  public get headersTab(): ChainablePromiseElement<
    Promise<WebdriverIO.Element>
  > {
    return $('#route-responses-menu .nav.nav-tabs .nav-item:nth-child(2)');
  }

  public get randomResponseIcon(): ChainablePromiseElement<
    Promise<WebdriverIO.Element>
  > {
    return $('#route-responses-random app-svg');
  }

  public get sequentialResponseIcon(): ChainablePromiseElement<
    Promise<WebdriverIO.Element>
  > {
    return $('#route-responses-sequential app-svg');
  }

  public get contentTypeElement(): ChainablePromiseElement<
    Promise<WebdriverIO.Element>
  > {
    return $('.environment-routes-footer div');
  }

  public async select(routeIndex: number): Promise<void> {
    await $(
      `.routes-menu .menu-list .nav-item:nth-child(${routeIndex}) .nav-link`
    ).click();
  }

  public async add(): Promise<void> {
    await this.addBtn.click();
  }

  public async remove(index: number) {
    await contextMenu.clickAndConfirm('routes', index, 5);
  }

  public async assertActiveMenuEntryText(expectedText: string): Promise<void> {
    const text = await this.activeMenuEntry.getText();
    expect(text).toContain(expectedText);
  }

  public async assertCount(expected: number) {
    await utils.countElements(
      $$('.routes-menu .menu-list .nav-item'),
      expected
    );
  }

  public async assertMethod(expected: string) {
    await utils.assertElementText(
      $('app-custom-select[formcontrolname="method"] .dropdown-toggle-label'),
      expected
    );
  }

  public async assertPath(expected: string) {
    expect(await this.pathInput.getValue()).toEqual(expected);
  }

  public async assertCountRouteResponses(expected: number) {
    await utils.countElements(
      $$('.route-responses-dropdown-menu .dropdown-item'),
      expected
    );
  }

  public async assertRouteResponseLabel(expected: string) {
    expect(
      await $('.form-control[formcontrolname="label"]').getValue()
    ).toEqual(expected);
  }

  public async assertRouteResponseStatusCode(expected: string) {
    await utils.assertElementText(
      $(
        'app-custom-select[formcontrolname="statusCode"] .dropdown-toggle-label'
      ),
      expected
    );
  }

  public async openDropdown(): Promise<void> {
    await this.addBtn.click();
  }

  public async setFile(value: string): Promise<void> {
    await utils.setElementValue(this.fileInput, value);
  }

  public async assertBody(value: string): Promise<void> {
    await utils.assertElementText(this.bodyEditor, value);
  }

  public async toggleDisable(routeIndex: number) {
    await contextMenu.click('routes', routeIndex, 4);
  }

  public async setFilter(text: string) {
    await utils.setElementValue(this.filter, text);
  }

  public async assertFilter(expected: string) {
    expect(await this.filter.getValue()).toEqual(expected);
  }

  public async clearFilter() {
    $('.btn[ngbTooltip="Clear filter"]').click();
  }

  public async toggleDisableTemplating() {
    await $("label[for='route-settings-disable-templating']").click();
  }

  public async selectRouteResponse(index: number) {
    await $('#route-responses-menu .dropdown-toggle').click();
    await $(
      `.route-responses-dropdown-menu .dropdown-item:nth-child(${index})`
    ).click();
  }

  public async addRouteResponse() {
    await $('#route-responses-menu #route-response-add').click();
  }

  public async removeRouteResponse() {
    const deleteButton = $(
      '#route-responses-menu #route-response-removal-button'
    );

    await deleteButton.click();
    await deleteButton.click();
  }

  public async duplicateRouteResponse() {
    await $('#route-responses-menu #route-response-duplication-button').click();
  }

  public async addResponseRule(rule: ResponseRule) {
    await $('app-route-response-rules .btn.add-rule').click();
    await $(
      'app-route-response-rules .rule-item:last-of-type .form-inline select[formcontrolname="target"]'
    ).selectByAttribute('value', rule.target);
    await utils.setElementValue(
      $(
        'app-route-response-rules .rule-item:last-of-type .form-inline input[formcontrolname="modifier"]'
      ),
      rule.modifier
    );
    await utils.setElementValue(
      $(
        'app-route-response-rules .rule-item:last-of-type .form-inline input[formcontrolname="value"]'
      ),
      rule.value
    );
  }

  public async assertRulesCount(expected: number) {
    await utils.countElements(
      $$('app-route-response-rules .rule-item'),
      expected
    );
  }

  public async assertRulesOperatorPresence(reverse = false) {
    await $('.rules-operator').waitForExist({ reverse });
  }

  public async assertContentType(expected: string) {
    expect(await this.contentTypeElement.getText()).toContain(expected);
  }

  public async assertRulesOperator(operator: LogicalOperators) {
    const element = await $(
      `.rules-operator input[id="rulesOperators${operator}"]`
    );
    const selected: boolean = await element.isSelected();
    expect(selected).toEqual(true);
  }

  public async selectRulesOperator(operator: LogicalOperators) {
    await $(`.rules-operator .rules-operator-${operator}`).click();
  }

  public async toggleRouteResponseRandom() {
    await $('#route-responses-random').click();
  }

  public async toggleRouteResponseSequential() {
    await $('#route-responses-sequential').click();
  }

  public async switchTab(tabName: TabsNameType): Promise<void> {
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

    await $(selectors[tabName]).click();
  }
}

export default new Routes();
