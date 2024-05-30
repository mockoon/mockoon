import utils, { DropdownMenuDatabucketActions } from '../libs/utils';

class Databuckets {
  public get nameInput() {
    return $('app-environment-databuckets input[formcontrolname="name"]');
  }

  public get documentationInput() {
    return $(
      'app-environment-databuckets input[formcontrolname="documentation"]'
    );
  }

  public get valueInput() {
    return $('app-environment-databuckets input[formcontrolname="value"]');
  }

  public get filter() {
    return $('input[id="databuckets-filter"]');
  }

  public get idElement() {
    return $('.environment-databuckets-footer div');
  }

  public get addBtn() {
    return $('.databuckets-menu div:first-of-type button');
  }

  public async select(databucketIndex: number): Promise<void> {
    await $(
      `.databuckets-menu .menu-list .nav-item:nth-child(${databucketIndex}) .nav-link`
    ).click();
  }

  public async add(): Promise<void> {
    await this.addBtn.click();
  }

  public async duplicate(index: number) {
    await utils.dropdownMenuClick(
      `.databuckets-menu .nav-item:nth-child(${index}) .nav-link`,
      DropdownMenuDatabucketActions.DUPLICATE
    );
  }

  public async duplicateToEnv(index: number) {
    await utils.dropdownMenuClick(
      `.databuckets-menu .nav-item:nth-child(${index}) .nav-link`,
      DropdownMenuDatabucketActions.DUPLICATE_TO_ENV
    );
  }

  public async copyID(index: number) {
    await utils.dropdownMenuClick(
      `.databuckets-menu .nav-item:nth-child(${index}) .nav-link`,
      DropdownMenuDatabucketActions.COPY_ID
    );
  }

  public async remove(index: number) {
    await utils.dropdownMenuClick(
      `.databuckets-menu .nav-item:nth-child(${index}) .nav-link`,
      DropdownMenuDatabucketActions.DELETE,
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
      $$('.databuckets-menu .menu-list .nav-item:not(.d-none)'),
      expected
    );
  }
}

export default new Databuckets();
