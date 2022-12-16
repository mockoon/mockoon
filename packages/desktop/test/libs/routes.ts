import { BodyTypes, LogicalOperators, ResponseRule } from '@mockoon/commons';
import { ChainablePromiseElement } from 'webdriverio';
import { TabsNameType } from '../../src/renderer/app/models/store.model';
import contextMenu from '../libs/context-menu';
import utils from '../libs/utils';

class Routes {
  private activeMenuEntrySelector = '.routes-menu .nav-item .nav-link.active';

  public get bodyTypeToggle(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('app-toggle[formControlName=bodyType]');
  }

  public get documentationInput(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('app-environment-routes input[formcontrolname="documentation"]');
  }

  public get pathInput(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('app-environment-routes input[formcontrolname="endpoint"]');
  }

  public get fileInput(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('app-environment-routes input[formcontrolname="filePath"]');
  }

  public get filter(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('input[id="route-filter"]');
  }

  public get bodyEditor(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('.ace_content');
  }

  public get routeResponseMenu(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('#route-responses-menu');
  }

  public get rulesTab(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('#route-responses-menu .nav.nav-tabs .nav-item:nth-child(3)');
  }

  public get headersTab(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('#route-responses-menu .nav.nav-tabs .nav-item:nth-child(2)');
  }

  public get settingsTab(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('#route-responses-menu .nav.nav-tabs .nav-item:nth-child(4)');
  }

  public get randomResponseBtn(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('#response-modes-RANDOM');
  }

  public get sequentialResponseBtn(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('#response-modes-SEQUENTIAL');
  }
  public get disableRulesResponseBtn(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('#response-modes-DISABLE_RULES');
  }

  public get contentTypeElement(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('.environment-routes-footer div');
  }

  public get disableTemplatingElement(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('label[for="route-settings-disable-templating"]');
  }

  public get fallback404Element(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('label[for="route-settings-fallback-to-404"]');
  }

  public get addResponseBtn(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('#route-responses-menu #route-response-add');
  }

  public get duplicateResponseBtn(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('#route-responses-menu #route-response-duplication-button');
  }

  public get routeResponseDropdown(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('.route-responses-dropdown-menu');
  }

  public get responseRuleOperatorToggle(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('.rules-operator');
  }

  public get bodyDataBucketSelect(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('app-custom-select[formcontrolname="databucketID"]');
  }

  private get addBtn(): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      '.routes-menu .nav:first-of-type .nav-item:nth-of-type(1) .nav-link'
    );
  }

  private get addFolderBtn(): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      '.routes-menu .nav:first-of-type .nav-item:nth-of-type(2) .nav-link'
    );
  }

  private get activeMenuEntry(): ChainablePromiseElement<WebdriverIO.Element> {
    return $(this.activeMenuEntrySelector);
  }

  public getResponseRule(
    index: number
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(`app-route-response-rules .rule-item:nth-of-type(${index})`);
  }

  public getResponseRuleTarget(
    index: number
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-route-response-rules .rule-item:nth-of-type(${index}) .form-inline select[formcontrolname="target"]`
    );
  }

  public getResponseRuleModifier(
    index: number
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-route-response-rules .rule-item:nth-of-type(${index}) .form-inline input[formcontrolname="modifier"]`
    );
  }

  public getResponseRuleInvert(
    index: number
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-route-response-rules .rule-item:nth-of-type(${index}) .form-inline app-toggle[formcontrolname="invert"]`
    );
  }

  public getResponseRuleOperator(
    index: number
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-route-response-rules .rule-item:nth-of-type(${index}) .form-inline select[formcontrolname="operator"]`
    );
  }

  public getResponseRulevalue(
    index: number
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-route-response-rules .rule-item:nth-of-type(${index}) .form-inline input[formcontrolname="value"]`
    );
  }

  public getResponseRuleReorderBtn(
    index: number
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-route-response-rules .rule-item:nth-of-type(${index}) app-svg[icon=drag_indicator]`
    );
  }

  public getRouteResponseFlagBtn(
    index: number
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `.route-responses-dropdown-menu .dropdown-item:nth-child(${index}) span:nth-child(2) app-svg`
    );
  }

  public getMenuItem(
    index: number
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(`.routes-menu .menu-list .nav-item:nth-child(${index}) .nav-link`);
  }

  public getMenuItemEditable(
    index: number
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `.routes-menu .menu-list .nav-item:nth-child(${index}) .nav-link app-editable-element`
    );
  }

  public async assertMenuItemEditable(index: number): Promise<void> {
    await $(
      `.routes-menu .menu-list .nav-item:nth-child(${index}) .nav-link app-editable-element span`
    ).waitForExist({
      reverse: true
    });
    await $(
      `.routes-menu .menu-list .nav-item:nth-child(${index}) .nav-link app-editable-element input`
    ).waitForExist();
  }

  public async setMenuItemEditableText(
    index: number,
    value: string
  ): Promise<void> {
    await browser.keys(['Control', 'a', 'Backspace']);
    await $(
      `.routes-menu .menu-list .nav-item:nth-child(${index}) .nav-link app-editable-element input`
    ).addValue(value);
    await browser.keys(['Enter']);
  }

  public async select(routeIndex: number): Promise<void> {
    await (await this.getMenuItem(routeIndex)).click();
  }

  public async selectBodyType(type: BodyTypes) {
    await $(`#body-type-${BodyTypes[type]}`).click();
  }

  public async add(): Promise<void> {
    await this.addBtn.click();
  }

  public async addFolder(): Promise<void> {
    await this.addFolderBtn.click();
  }

  public async remove(index: number) {
    await contextMenu.clickAndConfirm('routes', index, 6);
  }

  public async removeFolder(index: number) {
    await contextMenu.clickAndConfirm('routes', index, 3);
  }

  public async assertMenuEntryText(
    index: number,
    expectedText: string
  ): Promise<void> {
    const text = await (await this.getMenuItem(index)).getText();
    expect(text).toContain(expectedText);
  }

  public async assertActiveMenuEntryText(expectedText: string): Promise<void> {
    const text = await this.activeMenuEntry.getText();
    expect(text).toContain(expectedText);
  }

  public async assertCount(expected: number) {
    await utils.countElements(
      $$('.routes-menu .menu-list .nav-item:not(.d-none)'),
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

  public async setFile(value: string): Promise<void> {
    await utils.setElementValue(this.fileInput, value);
  }

  public async assertBody(value: string): Promise<void> {
    await utils.assertElementText(this.bodyEditor, value);
  }

  public async toggleDisable(routeIndex: number) {
    await contextMenu.click('routes', routeIndex, 5);
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
    await this.disableTemplatingElement.click();
  }

  public async togglefallback404() {
    await this.fallback404Element.click();
  }

  public async selectRouteResponse(index: number) {
    await $(
      `.route-responses-dropdown-menu .dropdown-item:nth-child(${index})`
    ).click();
  }

  public async openDataBucketMenu() {
    await $('#databuckets-dropdown .dropdown-toggle').click();
  }

  public async selectDataBucket(index: number) {
    await $(
      `#databuckets-dropdown-menu .dropdown-item:nth-child(${index})`
    ).click();
  }

  public async addRouteResponse() {
    await this.addResponseBtn.click();
  }

  public async removeRouteResponse() {
    const deleteButton = $(
      '#route-responses-menu #route-response-removal-button'
    );

    await deleteButton.click();
    await deleteButton.click();
  }

  public async openRouteResponseMenu() {
    await $('#route-responses-menu .dropdown-toggle').click();
  }

  public async assertDefaultRouteResponse(index: number, reverse = false) {
    const flag = $(
      `.route-responses-dropdown-menu .dropdown-item:nth-child(${index}) span:nth-child(2) app-svg`
    );

    if (reverse) {
      await utils.assertHasAttribute(flag, 'icon', 'outlined_flag');
    } else {
      await utils.assertHasAttribute(flag, 'icon', 'flag');
    }
  }

  public async assertDefaultRouteResponseClass(
    index: number,
    className: string
  ) {
    const flagContainer = $(
      `.route-responses-dropdown-menu .dropdown-item:nth-child(${index}) span:nth-child(2)`
    );

    await utils.assertHasClass(flagContainer, className);
  }

  public async setDefaultRouteResponse(index: number) {
    const flag = $(
      `.route-responses-dropdown-menu .dropdown-item:nth-child(${index}) span:nth-child(2)`
    );
    await flag.click();
  }

  public async duplicateRouteResponse() {
    await this.duplicateResponseBtn.click();
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

  public async removeResponseRule(index: number) {
    const deleteBtn = await $(
      `app-route-response-rules .rule-item:nth-of-type(${index}) .btn.delete-rule`
    );

    // click and confirm
    await deleteBtn.click();
    await deleteBtn.click();
  }

  public async assertRulesCount(expected: number) {
    await utils.countElements(
      $$('app-route-response-rules .rule-item'),
      expected
    );
  }

  public async assertRulesOperatorPresence(reverse = false) {
    await this.responseRuleOperatorToggle.waitForExist({ reverse });
  }

  public async assertContentType(expected: string) {
    expect(await this.contentTypeElement.getText()).toContain(expected);
  }

  public async assertRulesOperator(operator: LogicalOperators) {
    const element = await $(
      `.rules-operator #rules-operators-${operator} input`
    );
    const selected: boolean = await element.isSelected();
    expect(selected).toEqual(true);
  }

  public async selectRulesOperator(operator: LogicalOperators) {
    await $(`.rules-operator #rules-operators-${operator}`).click();
  }

  public async toggleRouteResponseRandom() {
    await $('#response-modes-RANDOM').click();
  }

  public async toggleRouteResponseSequential() {
    await $('#response-modes-SEQUENTIAL').click();
  }

  public async toggleRouteResponseDisableRules() {
    await $('#response-modes-DISABLE_RULES').click();
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

  public async assertRoutePaddingLevel(
    index: number,
    level: number
  ): Promise<void> {
    const levels = {
      1: '14px',
      2: '35px',
      3: '63px'
    };
    const subRoutePadding = await (
      await this.getMenuItem(index)
    ).getCSSProperty('padding-left');
    expect(subRoutePadding.value).toEqual(levels[level]);
  }
}

export default new Routes();
