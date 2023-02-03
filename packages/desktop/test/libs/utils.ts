import {
  ChainablePromiseArray,
  ChainablePromiseElement,
  ElementArray
} from 'webdriverio';
import { ToastTypes } from '../../src/renderer/app/models/toasts.model';
import { Config } from '../../src/shared/config';

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
    text: string
  ): Promise<void> {
    expect(await element.getText()).toEqual(text);
  }

  public async assertElementTextContain(
    element: ChainablePromiseElement<WebdriverIO.Element>,
    text: string
  ): Promise<void> {
    expect(await element.getText()).toContain(text);
  }

  public async countElements(
    elements: ChainablePromiseArray<ElementArray>,
    expected: number
  ) {
    expect((await elements).length).toEqual(expected);
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
    await browser.pause(Config.storageSaveDelay + 500);
  }

  public async waitForFileWatcher(): Promise<void> {
    await browser.pause(Config.fileReWatchDelay + 500);
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
}

export default new Utils();
