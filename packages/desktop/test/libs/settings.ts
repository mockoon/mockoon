import { ChainablePromiseElement } from 'webdriverio';
import menu from '../libs/menu';
import utils from '../libs/utils';

type SettingNames =
  | 'settings-truncate-route-name'
  | 'settings-log-body-size'
  | 'settings-faker-seed'
  | 'settings-storage-pretty-print'
  | 'settings-storage-file-watcher'
  | 'settings-log-max-count'
  | 'settings-enable-telemetry'
  | 'settings-faker-locale'
  | 'start-environments-on-load';

class Settings {
  public get prettyPrint(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('.modal-dialog label[for="settings-storage-pretty-print"]');
  }

  public async open() {
    await menu.click('MENU_OPEN_SETTINGS');
    await $('.modal-dialog').waitForExist();
  }

  public async toggleSetting(settingName: SettingNames): Promise<void> {
    const setting = this.getSettingCheckbox(settingName);
    await setting.click();
  }

  public async setSettingValue(
    settingName: SettingNames,
    value: string
  ): Promise<void> {
    const setting = this.getSettingInput(settingName);
    await utils.setElementValue(setting, value);
  }

  public async setDropdownSettingValue(
    settingName: SettingNames,
    index: number
  ): Promise<void> {
    await $(`#${settingName}-dropdown .dropdown-toggle`).click();
    await $(
      `#${settingName}-dropdown-menu .dropdown-item:nth-child(${index})`
    ).click();
  }

  public async assertDropdownSettingValue(
    settingName: 'fileWatcherEnabled',
    value: string
  ): Promise<void> {
    await utils.assertDropdownValue(settingName, value);
  }

  private getSettingInput(
    settingName: SettingNames
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(`.modal-dialog input#${settingName}`);
  }

  private getSettingCheckbox(
    settingName: SettingNames
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(`.modal-dialog input#${settingName} ~ .custom-control-label`);
  }
}

export default new Settings();
