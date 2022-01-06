import { ChainablePromiseElement } from 'webdriverio';
import menu from '../libs/menu';
import utils from '../libs/utils';

type SettingNames =
  | 'settings-truncate-route-name'
  | 'settings-analytics'
  | 'settings-log-body-size'
  | 'settings-faker-seed'
  | 'settings-storage-pretty-print'
  | 'settings-log-max-count'
  | 'settings-enable-telemetry'
  | 'settings-faker-locale';

class Settings {
  public get documentationInput(): ChainablePromiseElement<
    Promise<WebdriverIO.Element>
  > {
    return $('app-environment-routes input[formcontrolname="documentation"]');
  }

  public async open() {
    await menu.click('OPEN_SETTINGS');
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

  public async selectSettingValue(
    settingName: SettingNames,
    value: string
  ): Promise<void> {
    const setting = this.getSettingSelect(settingName);
    await setting.selectByAttribute('value', value);
  }

  private getSettingSelect(
    settingName: SettingNames
  ): ChainablePromiseElement<Promise<WebdriverIO.Element>> {
    return $(`.modal-dialog select#${settingName}`);
  }

  private getSettingInput(
    settingName: SettingNames
  ): ChainablePromiseElement<Promise<WebdriverIO.Element>> {
    return $(`.modal-dialog input#${settingName}`);
  }

  private getSettingCheckbox(
    settingName: SettingNames
  ): ChainablePromiseElement<Promise<WebdriverIO.Element>> {
    return $(`.modal-dialog input#${settingName} ~ .custom-control-label`);
  }
}

export default new Settings();
