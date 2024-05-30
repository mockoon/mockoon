import { ChainablePromiseArray, ChainablePromiseElement } from 'webdriverio';
import { ToastTypes } from '../../src/renderer/app/models/toasts.model';
import { SharedConfig } from '../../src/shared/shared-config';

const Config = SharedConfig({ apiURL: '', websiteURL: '' });

export enum DropdownMenuEnvironmentActions {
  DUPLICATE_TO_CLOUD = 1,
  DUPLICATE = 2,
  COPY_JSON = 3,
  SHOW_FOLDER = 4,
  MOVE_FOLDER = 5,
  CLOSE = 6
}

export enum DropdownMenuDatabucketActions {
  DUPLICATE = 1,
  DUPLICATE_TO_ENV = 2,
  COPY_ID = 3,
  DELETE = 4
}

export enum DropdownMenuCallbackActions {
  DUPLICATE = 1,
  DUPLICATE_TO_ENV = 2,
  DELETE = 3
}

export enum DropdownMenuRouteActions {
  DUPLICATE = 1,
  DUPLICATE_TO_ENV = 2,
  COPY_JSON = 3,
  COPY_PATH = 4,
  TOGGLE = 5,
  DELETE = 6
}

export enum DropdownMenuFolderActions {
  ADD_CRUD = 1,
  ADD_HTTP = 2,
  ADD_FOLDER = 3,
  TOGGLE_FOLDER = 4,
  DELETE = 5
}

class Utils {
  public async clearElementValue(
    element: ChainablePromiseElement<WebdriverIO.Element>
  ): Promise<void> {
    // clearing by entering text and removing it as some validation directive does not react to 'change' event
    await element.click();
    await element.setValue(' ');
    await browser.keys(['Backspace']);
  }

  public async setElementValue(
    element: ChainablePromiseElement<WebdriverIO.Element>,
    value: string
  ): Promise<void> {
    // ensure we unfocus previously selected fields (on Linux, using setValue, previous fields with typeaheads may still show the menu and not be immediately unfocused)
    await element.click();
    await element.setValue(value);
  }

  public async assertElementValue(
    element: ChainablePromiseElement<WebdriverIO.Element>,
    value: string
  ): Promise<void> {
    expect(await element.getValue()).toEqual(value);
  }

  public async assertHasClass(
    element: ChainablePromiseElement<WebdriverIO.Element>,
    className: string,
    reverse = false
  ): Promise<void> {
    const classes = await element.getAttribute('class');

    if (reverse) {
      expect(classes).not.toContain(className);
    } else {
      expect(classes).toContain(className);
    }
  }

  public async setDropdownValue(dropdownId: string, index: number) {
    await $(`#${dropdownId}-dropdown .dropdown-toggle`).click();
    await $(
      `#${dropdownId}-dropdown-menu .dropdown-item:nth-child(${index})`
    ).click();
  }

  public async assertDropdownValue(
    targetControlName: string,
    expected: string
  ) {
    await this.assertElementText(
      $(
        `app-custom-select[formcontrolname="${targetControlName}"] .dropdown-toggle-label`
      ),
      expected
    );
  }

  public async assertHasAttribute(
    element: ChainablePromiseElement<WebdriverIO.Element>,
    attributeName: string,
    content: string,
    reverse = false
  ): Promise<void> {
    const attributeContent = await element.getAttribute(attributeName);

    if (reverse) {
      expect(attributeContent).not.toContain(content);
    } else {
      expect(attributeContent).toContain(content);
    }
  }

  public async assertElementText(
    element: ChainablePromiseElement<WebdriverIO.Element>,
    text: string,
    multiline = false
  ): Promise<void> {
    expect(await element.getText()).toEqual(
      multiline ? text.replace(/[ ]/g, '\n') : text
    );
  }

  public async assertElementTextContain(
    element: ChainablePromiseElement<WebdriverIO.Element>,
    text: string
  ): Promise<void> {
    expect(await element.getText()).toContain(text);
  }

  public async countElements(
    elements: ChainablePromiseArray<WebdriverIO.ElementArray>,
    expected: number
  ) {
    expect((await elements).length).toEqual(expected);
  }

  public async dropdownMenuOpen(parentSelector: string): Promise<void> {
    await $(`${parentSelector} .dropdown-toggle`).click();
  }

  public async dropdownMenuClose(): Promise<void> {
    await this.clickOutside();
  }

  public dropdownMenuGetItemRef(
    itemIndex:
      | DropdownMenuEnvironmentActions
      | DropdownMenuDatabucketActions
      | DropdownMenuCallbackActions
      | DropdownMenuRouteActions
      | DropdownMenuFolderActions
  ) {
    return $(
      `body > .dropdown .dropdown-menu.show .dropdown-item:nth-child(${itemIndex})`
    );
  }

  public async dropdownMenuClick(
    parentSelector: string,
    itemIndex:
      | DropdownMenuEnvironmentActions
      | DropdownMenuDatabucketActions
      | DropdownMenuCallbackActions
      | DropdownMenuRouteActions
      | DropdownMenuFolderActions,
    confirm = false
  ): Promise<void> {
    await $(`${parentSelector} .dropdown-toggle`).click();

    const itemSelector = `body > .dropdown .dropdown-menu.show .dropdown-item:nth-child(${itemIndex})`;
    await $(itemSelector).click();

    if (confirm) {
      await $(itemSelector).click();
    }
  }

  public async dropdownMenuAssertDisabled(
    parentSelector: string,
    itemIndex:
      | DropdownMenuEnvironmentActions
      | DropdownMenuDatabucketActions
      | DropdownMenuCallbackActions
      | DropdownMenuRouteActions
      | DropdownMenuFolderActions,
    reverse = false
  ): Promise<void> {
    await $(`${parentSelector} .dropdown-toggle`).click();

    const itemSelector = `body > .dropdown .dropdown-menu.show .dropdown-item:nth-child(${itemIndex})`;
    await this.assertHasClass($(itemSelector), 'disabled', reverse);

    await this.clickOutside();
  }

  public async openDropdown(dropdownId: string): Promise<void> {
    await $(`#${dropdownId}-dropdown`).click();
  }

  public async selectDropdownItem(
    dropdownId: string,
    itemIndex: number
  ): Promise<void> {
    await $(
      `#${dropdownId}-dropdown-menu .dropdown-menu-content button:nth-of-type(${itemIndex})`
    ).click();
  }

  public async setDropdownInputValue(dropdownId: string, value: string) {
    await $(`#${dropdownId}-dropdown-menu .form-control`).setValue(value);
  }

  public async assertDropdownItemsNumber(
    dropdownId: string,
    expectedNumber: number
  ) {
    await this.countElements(
      $$(`#${dropdownId}-dropdown-menu .dropdown-menu-content button`),
      expectedNumber
    );
  }

  public async assertDropdownItemText(
    dropdownId: string,
    itemIndex: number,
    expectedText: string
  ) {
    await this.assertElementText(
      $(
        `#${dropdownId}-dropdown-menu .dropdown-menu-content button:nth-of-type(${itemIndex})`
      ),
      expectedText
    );
  }

  public async assertDropdownToggleText(
    dropdownId: string,
    expectedText: string
  ) {
    await this.assertElementText(
      $(`#${dropdownId}-dropdown .dropdown-toggle`),
      expectedText
    );
  }

  public async waitForAutosave(): Promise<void> {
    await browser.pause(Config.storageSaveDelay + 1000);
  }

  public async waitForFileWatcher(): Promise<void> {
    await browser.pause(Config.fileReWatchDelay + 1000);
  }

  public async checkToastDisplayed(toastType: ToastTypes, text: string) {
    const toastSelector = `.toast.toast-${toastType}:last-of-type`;

    await $(toastSelector).waitForExist();

    if (text) {
      await this.assertElementTextContain(
        $(`${toastSelector} .toast-body`),
        text
      );
    }
  }

  public async closeToast() {
    await $('.toast:last-of-type').click();
  }

  public makeString(length: number): string {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  public async closeTooltip() {
    await this.clickOutside();
  }

  public async clickOutside() {
    await $('body').click({ x: 0, y: 0 });
  }
}

export default new Utils();
