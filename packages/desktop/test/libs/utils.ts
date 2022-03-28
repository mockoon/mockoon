import {
  ChainablePromiseArray,
  ChainablePromiseElement,
  ElementArray
} from 'webdriverio';
import { ToastTypes } from '../../src/renderer/app/models/toasts.model';

class Utils {
  public async setElementValue(
    element: ChainablePromiseElement<Promise<WebdriverIO.Element>>,
    value: string
  ): Promise<void> {
    // ensure we unfocus previously selected fields (on Linux, using setValue, previous fields with typeaheads may still show the menu and not be immediately unfocused)
    await element.click();
    await element.setValue(value);
  }

  public async assertHasClass(
    element: ChainablePromiseElement<Promise<WebdriverIO.Element>>,
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

  public async assertElementText(
    element: ChainablePromiseElement<Promise<WebdriverIO.Element>>,
    text: string
  ): Promise<void> {
    expect(await element.getText()).toEqual(text);
  }

  public async assertElementTextContain(
    element: ChainablePromiseElement<Promise<WebdriverIO.Element>>,
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
    await browser.pause(1500);
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
