import { ChainablePromiseElement } from 'webdriverio';
import utils from '../libs/utils';

type SettingNames =
  | 'endpointPrefix'
  | 'name'
  | 'port'
  | 'certPath'
  | 'keyPath'
  | 'passphrase'
  | 'localhostOnly';

/**
 * Requires a switch to the settings view
 */
class EnvironmentsSettings {
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

  public async assertSettingValue(
    settingName: SettingNames,
    value: string
  ): Promise<void> {
    const setting = this.getSettingInput(settingName);
    expect(await setting.getValue()).toEqual(value);
  }

  private getSettingInput(
    settingName: SettingNames
  ): ChainablePromiseElement<Promise<WebdriverIO.Element>> {
    return $(`app-environment-settings input[formcontrolname=${settingName}]`);
  }

  private getSettingCheckbox(
    settingName: SettingNames
  ): ChainablePromiseElement<Promise<WebdriverIO.Element>> {
    return $(
      `app-environment-settings input[formcontrolname=${settingName}] + label`
    );
  }
}

export default new EnvironmentsSettings();
