import { ChainablePromiseElement } from 'webdriverio';
import utils from '../libs/utils';

type SettingNames =
  | 'endpointPrefix'
  | 'name'
  | 'hostname'
  | 'port'
  | 'certPath'
  | 'keyPath'
  | 'passphrase'
  // enable tls formControlName
  | 'enabled';

/**
 * Requires a switch to the settings view
 */
class EnvironmentsSettings {
  public get certContainer(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('app-environment-settings #tls-cert-container');
  }

  public get hostname(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('app-environment-settings input[formcontrolname=hostname]');
  }

  public get prefix(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('app-environment-settings input[formcontrolname=endpointPrefix]');
  }

  public get enableTLS(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('app-environment-settings label[for=env-settings-tls-enabled]');
  }

  public get preflight(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('app-environment-settings label[for=env-settings-cors]');
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

  public async clearSettingValue(settingName: SettingNames): Promise<void> {
    const setting = this.getSettingInput(settingName);
    await utils.clearElementValue(setting);
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
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(`app-environment-settings input[formcontrolname=${settingName}]`);
  }

  private getSettingCheckbox(
    settingName: SettingNames
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-environment-settings input[formcontrolname=${settingName}] + label`
    );
  }
}

export default new EnvironmentsSettings();
