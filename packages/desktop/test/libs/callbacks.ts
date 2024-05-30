import utils, { DropdownMenuCallbackActions } from '../libs/utils';

class Callbacks {
  public get nameInput() {
    return $('app-environment-callbacks input[formcontrolname="name"]');
  }

  public get documentationInput() {
    return $(
      'app-environment-callbacks input[formcontrolname="documentation"]'
    );
  }

  public get methodInput() {
    return $('app-environment-callbacks input[formcontrolname="method"]');
  }

  public get uriInput() {
    return $('app-environment-callbacks input[formcontrolname="uri"]');
  }

  public get valueInput() {
    return $('app-environment-callbacks input[formcontrolname="value"]');
  }

  public get filter() {
    return $('input[id="callbacks-filter"]');
  }

  public get idElement() {
    return $('.environment-callbacks-footer div');
  }

  public get addBtn() {
    return $('.callbacks-menu .nav:first-of-type .nav-item .nav-link');
  }

  public get attachCallbackBtn() {
    return $('.add-callback');
  }

  public get definitionTab() {
    return $('.callback-tabs ul.nav .nav-item:nth-child(1) .nav-link');
  }

  public get bodyTabInDefinition() {
    return $('.callback-spec-tabs ul.nav .nav-item:nth-child(1) .nav-link');
  }

  public get headersTabInDefinition() {
    return $('.callback-spec-tabs ul.nav .nav-item:nth-child(2) .nav-link');
  }

  public get usageTab() {
    return $('.callback-tabs ul.nav .nav-item:nth-child(2) .nav-link');
  }

  public async assertDefinitionTabActive() {
    await utils.assertHasClass(this.definitionTab, 'active');
  }

  public async assertUsageTabActive() {
    await utils.assertHasClass(this.usageTab, 'active');
  }

  public async assertUsageCount(count: number): Promise<void> {
    await utils.assertElementText(this.usageTab, `Usage ${count}`, true);
  }

  public async assertHasUsageItems(count: number) {
    await utils.countElements($$('.callback-usage-item'), count);
  }

  public async assertUsageRouteText(index: number, text: string) {
    await utils.assertElementText(this.getUsageItem(index), text);
  }

  public async assertUsageRouteResponseText(
    routeIndex: number,
    responseIndex: number,
    text: string
  ) {
    await utils.assertElementText(
      this.getUsageItem(routeIndex, responseIndex),
      text
    );
  }

  public getGoToDefinitionBtn(index: number) {
    return $(
      `.callback-list .callback-item:nth-child(${index}) .goto-definition-callback`
    );
  }

  public getUsageItem(routeIndex: number, responseIndex?: number) {
    if (responseIndex > 0) {
      return $(
        `.callback-usage-item:nth-child(${routeIndex}) > a:nth-child(${
          responseIndex + 1
        })`
      );
    } else {
      return $(
        `.callback-usage-item:nth-child(${routeIndex}) > .callback-usage-route-item`
      );
    }
  }

  public async assertNoUsageLabelExists() {
    expect(await $('.scroll-content div p').getText()).toEqual(
      'No usage found for this callback'
    );
  }

  public async assertNoBodySupportingLabelExists(toExist: boolean) {
    if (toExist) {
      expect(await $('.notsupporting-callback-body p').getText()).toEqual(
        'Request body cannot be defined for this HTTP method'
      );
    } else {
      expect(await $('.notsupporting-callback-body p').isExisting()).toEqual(
        false
      );
    }
  }

  public async assertCallbackBodySpecExists(toExists: boolean) {
    expect(await $('.callback-body-spec').isExisting()).toEqual(toExists);
  }

  public async assertActiveCallbackEntryText(
    expectedText: string
  ): Promise<void> {
    const text = await $(
      '.callbacks-menu .nav-item .nav-link.active'
    ).getText();
    expect(text).toContain(expectedText);
  }

  public async assertGotoDefinitionExists(
    btnIndex: number,
    exists: boolean
  ): Promise<void> {
    expect(
      await $(`button[data-testid="callback${btnIndex}gotodef"]`).isExisting()
    ).toEqual(exists);
  }

  public async deleteAttachedCallback(btnIndex: number): Promise<void> {
    await $(`button[data-testid="callback${btnIndex}delete"]`).click();
    await $(`button[data-testid="callback${btnIndex}delete"]`).click();
  }

  public async assertNumberofAttachedCallbacks(count: number): Promise<void> {
    await utils.countElements($$('.callback-list .callback-item'), count);
  }

  public async assertRouteCallbackHasEntries(
    cbIndex: number,
    expectedListSize: number
  ) {
    await utils.openDropdown(`callback${cbIndex}target`);
    await browser.pause(100);
    await utils.assertDropdownItemsNumber(
      `callback${cbIndex}target`,
      expectedListSize
    );
  }

  public async select(callbackIndex: number): Promise<void> {
    await $(
      `.callbacks-menu .menu-list .nav-item:nth-child(${callbackIndex}) .nav-link`
    ).click();
  }

  public async attachCallback(): Promise<void> {
    await this.attachCallbackBtn.click();
  }

  public async add(): Promise<void> {
    await this.addBtn.click();
  }

  public async duplicate(index: number) {
    await utils.dropdownMenuClick(
      `.callbacks-menu .nav-item:nth-child(${index}) .nav-link`,
      DropdownMenuCallbackActions.DUPLICATE
    );
  }

  public async duplicateToEnv(index: number) {
    await utils.dropdownMenuClick(
      `.callbacks-menu .nav-item:nth-child(${index}) .nav-link`,
      DropdownMenuCallbackActions.DUPLICATE_TO_ENV
    );
  }

  public async remove(index: number) {
    await utils.dropdownMenuClick(
      `.callbacks-menu .nav-item:nth-child(${index}) .nav-link`,
      DropdownMenuCallbackActions.DELETE,
      true
    );
  }

  public async assertName(expected: string) {
    expect(await this.nameInput.getValue()).toEqual(expected);
  }

  public async assertDocumentation(expected: string) {
    expect(await this.documentationInput.getValue()).toEqual(expected);
  }

  public async setName(value: string): Promise<void> {
    await utils.setElementValue(this.nameInput, value);
  }

  public async setDocumentation(value: string): Promise<void> {
    await utils.setElementValue(this.documentationInput, value);
  }

  public async setUri(value: string) {
    await utils.setElementValue(this.uriInput, value);
  }

  public async setMethod(index: number) {
    await utils.openDropdown('cbmethods');
    await utils.selectDropdownItem('cbmethods', index);
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

  public async assertCount(expected: number) {
    await utils.countElements(
      $$('.callbacks-menu .menu-list .nav-item:not(.d-none)'),
      expected
    );
  }
}

export default new Callbacks();
