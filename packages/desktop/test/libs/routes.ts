import { BodyTypes, LogicalOperators, ResponseRule } from '@mockoon/commons';
import { TabsNameType } from '../../src/renderer/app/models/store.model';
import utils, {
  DropdownMenuFolderActions,
  DropdownMenuRouteActions
} from '../libs/utils';

export enum RoutesMenuActions {
  OPEN_TEMPLATES = 1,
  ADD_CRUD_ROUTE = 2,
  ADD_HTTP_ROUTE = 3,
  ADD_FOLDER = 4
}
class Routes {
  private rulesTargetIndexes = {
    body: 1,
    query: 2,
    header: 3,
    cookie: 4,
    params: 5,
    request_number: 6
  };
  private rulesOperatorsIndexes = {
    equals: 1,
    regex: 2,
    regex_i: 3,
    null: 4,
    empty_array: 5
  };
  private activeMenuEntrySelector = '.routes-menu .nav-item .nav-link.active';

  public get bodyTypeToggle() {
    return $('app-toggle[formControlName=bodyType]');
  }

  public get documentationInput() {
    return $('app-environment-routes input[formcontrolname="documentation"]');
  }

  public get pathInput() {
    return $('app-environment-routes input[formcontrolname="endpoint"]');
  }

  public get fileInput() {
    return $('app-environment-routes input[formcontrolname="filePath"]');
  }

  public get filter() {
    return $('input[id="routes-filter"]');
  }

  public get bodyEditor() {
    return $('.ace_content');
  }

  public get routeResponseMenu() {
    return $('#route-responses-menu');
  }

  public get rulesTab() {
    return $('#route-responses-menu .nav.nav-tabs .nav-item:nth-child(3)');
  }

  public get headersTab() {
    return $('#route-responses-menu .nav.nav-tabs .nav-item:nth-child(2)');
  }

  public get callbacksTab() {
    return $('#route-responses-menu .nav.nav-tabs .nav-item:nth-child(4)');
  }

  public get settingsTab() {
    return $('#route-responses-menu .nav.nav-tabs .nav-item:nth-child(5)');
  }

  public get randomResponseBtn() {
    return $('#response-modes-RANDOM');
  }

  public get sequentialResponseBtn() {
    return $('#response-modes-SEQUENTIAL');
  }
  public get disableRulesResponseBtn() {
    return $('#response-modes-DISABLE_RULES');
  }

  public get fallbackResponseBtn() {
    return $('#response-modes-FALLBACK');
  }

  public get rulesWarningMessage() {
    return $('#disabled-rules-warning-message');
  }

  public get rulesWarningIcon() {
    return $('#disabled-rules-warning-icon');
  }

  public get contentTypeElement() {
    return $('.environment-routes-footer div');
  }

  public get disableTemplatingElement() {
    return $('label[for="route-settings-disable-templating"]');
  }

  public get fallback404Element() {
    return $('label[for="route-settings-fallback-to-404"]');
  }

  public get addResponseBtn() {
    return $('#route-responses-menu #route-response-add');
  }

  public get duplicateResponseBtn() {
    return $('#route-responses-menu #route-response-duplication-button');
  }

  public get routeResponseStatusDropdown() {
    return $('#status-code-dropdown');
  }

  public get routeResponseDropdownlabel() {
    return $('#route-responses-dropdown .dropdown-toggle-label');
  }

  public get routeResponseDropdown() {
    return $('.route-responses-dropdown-menu');
  }

  public get responseRuleOperatorToggle() {
    return $('.rules-operator');
  }

  public get bodyDataBucketSelect() {
    return $('app-custom-select[formcontrolname="databucketID"]');
  }

  public get idPropertyDataBucketSelect() {
    return $('.form-control[formcontrolname="crudKey"]');
  }

  public get addMenu() {
    return $('#routes-add-dropdown-menu');
  }

  public get templateGenerateBtn() {
    return $('.modal-content #templates-generate-button');
  }

  public get endpointGenerateBtn() {
    return $('.modal-content #templates-endpoint-generate-button');
  }

  public get templateGenerateOptions() {
    return $('.modal-content #templates-generate-option');
  }

  public get templatePromptInput() {
    return $('.modal-content input.form-control');
  }

  private get activeMenuEntry() {
    return $(this.activeMenuEntrySelector);
  }

  public getTemplateTab(index: 1 | 2 | 3) {
    return $(`.modal-content .nav .nav-item:nth-child(${index}) .nav-link`);
  }

  public getAddMenuEntry(index: RoutesMenuActions) {
    return $(`#routes-add-dropdown-menu .dropdown-item:nth-child(${index})`);
  }

  public getResponseRule(index: number) {
    return $(`app-route-response-rules .rule-item:nth-of-type(${index})`);
  }

  public getResponseRuleTarget(index: number) {
    return $(
      `app-route-response-rules .rule-item:nth-of-type(${index})  [formcontrolname="target"]`
    );
  }

  public getResponseRuleModifier(index: number) {
    return $(
      `app-route-response-rules .rule-item:nth-of-type(${index})  input[formcontrolname="modifier"]`
    );
  }

  public getResponseRuleInvert(index: number) {
    return $(
      `app-route-response-rules .rule-item:nth-of-type(${index})  app-toggle[formcontrolname="invert"]`
    );
  }

  public getResponseRuleOperator(index: number) {
    return $(
      `app-route-response-rules .rule-item:nth-of-type(${index}) [formcontrolname="operator"]`
    );
  }

  public getResponseRulevalue(index: number) {
    return $(
      `app-route-response-rules .rule-item:nth-of-type(${index}) input[formcontrolname="value"]`
    );
  }

  public getResponseRuleReorderBtn(index: number) {
    return $(
      `app-route-response-rules .rule-item:nth-of-type(${index}) app-svg[icon=drag_indicator]`
    );
  }

  public getRouteResponseFlagBtn(index: number) {
    return $(
      `.route-responses-dropdown-menu .dropdown-item:nth-child(${index}) span:nth-child(2) app-svg`
    );
  }

  public getMenuItem(index: number) {
    return $(`.routes-menu .menu-list .nav-item:nth-child(${index}) .nav-link`);
  }

  public getMenuItemEditable(index: number) {
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

  public async collapse(routeIndex: number): Promise<void> {
    await (await this.getMenuItem(routeIndex)).$('app-svg').click();
  }

  public async selectBodyType(type: BodyTypes) {
    await $(`#body-type-${BodyTypes[type]}`).click();
  }

  public async openAddMenu(): Promise<void> {
    await $('#routes-add-dropdown .dropdown-toggle').click();
  }

  public async openTemplates(): Promise<void> {
    await $('#routes-add-dropdown .dropdown-toggle').click();
    await $('#routes-add-dropdown-menu .dropdown-item:nth-child(1)').click();
  }

  public async addCRUDRoute(): Promise<void> {
    await $('#routes-add-dropdown .dropdown-toggle').click();
    await $('#routes-add-dropdown-menu .dropdown-item:nth-child(2)').click();
  }

  public async addHTTPRoute(): Promise<void> {
    await $('#routes-add-dropdown .dropdown-toggle').click();
    await $('#routes-add-dropdown-menu .dropdown-item:nth-child(3)').click();
  }

  public async addWebSocket(): Promise<void> {
    await $('#routes-add-dropdown .dropdown-toggle').click();
    await $('#routes-add-dropdown-menu .dropdown-item:nth-child(4)').click();
  }

  public async addFolder(): Promise<void> {
    await $('#routes-add-dropdown .dropdown-toggle').click();
    await $('#routes-add-dropdown-menu .dropdown-item:nth-child(5)').click();
  }

  public async selectTemplateTab(index: 1 | 2 | 3): Promise<void> {
    await this.getTemplateTab(index).click();
  }

  public async remove(index: number) {
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${index}) .nav-link`,
      DropdownMenuRouteActions.DELETE,
      true
    );
  }

  public async removeFolder(index: number) {
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${index}) .nav-link`,
      DropdownMenuFolderActions.DELETE,
      true
    );
  }

  public async selectTemplate(index: 1 | 2): Promise<void> {
    this.getTemplateTab(index).click();
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
    await utils.assertDropdownValue('method', expected);
  }

  public async setMethod(index: number) {
    await utils.setDropdownValue('methods', index);
  }

  public async assertPath(expected: string) {
    expect(await this.pathInput.getValue()).toEqual(expected);
  }

  public async setTemplatePrompt(text: string) {
    await utils.setElementValue(this.templatePromptInput, text);
  }

  public async clickTemplateGenerate() {
    await this.templateGenerateBtn.click();
  }

  public async clickEndpointGenerate() {
    await this.endpointGenerateBtn.click();
  }

  public async setPath(text: string) {
    await utils.setElementValue(this.pathInput, text);
  }

  public async setCrudKey(text: string) {
    await utils.setElementValue(this.idPropertyDataBucketSelect, text);
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
    await utils.assertDropdownValue('statusCode', expected);
  }

  public async setRouteResponseStatusCode(statusIndex: number) {
    await utils.setDropdownValue('status-code', statusIndex);
  }

  public async setFile(value: string): Promise<void> {
    await utils.setElementValue(this.fileInput, value);
  }

  public async assertBody(value: string): Promise<void> {
    await utils.assertElementText(this.bodyEditor, value);
  }

  public async toggleDisable(routeIndex: number) {
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${routeIndex}) .nav-link`,
      DropdownMenuRouteActions.TOGGLE
    );
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

  public async assertDataBucketMenuLabel(expected: string) {
    await utils.assertElementText(
      $('#databuckets-dropdown .dropdown-toggle-label'),
      expected
    );
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

  public async assertSelectedRouteResponseLabel(expected: string) {
    await utils.assertElementText(this.routeResponseDropdownlabel, expected);
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
    const lastRuleIndex = (await $$('.rule-item').length) - 1;
    await utils.setDropdownValue(
      `rules${lastRuleIndex}target`,
      this.rulesTargetIndexes[rule.target]
    );
    await utils.setElementValue(
      $(
        'app-route-response-rules .rule-item:last-of-type input[formcontrolname="modifier"]'
      ),
      rule.modifier
    );
    await utils.setDropdownValue(
      `rules${lastRuleIndex}operator`,
      this.rulesOperatorsIndexes[rule.operator]
    );

    if (rule.operator !== 'null') {
      await utils.setElementValue(
        $(
          'app-route-response-rules .rule-item:last-of-type input[formcontrolname="value"]'
        ),
        rule.value
      );
    }
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

  public async toggleRouteResponseFallback() {
    await $('#response-modes-FALLBACK').click();
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
      CALLBACKS:
        '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(4) .nav-link',
      SETTINGS:
        '#route-responses-menu .nav.nav-tabs .nav-item:nth-child(5) .nav-link'
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
