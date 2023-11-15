import { ChainablePromiseElement } from '@wdio/globals/node_modules/webdriverio';
import utils from '../libs/utils';

type optionNames = 'proxyHost' | 'proxyMode' | 'proxyRemovePrefix';

/**
 * Requires a switch to the proxy view
 */
class EnvironmentsProxy {
  public get headersContainer(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('.environment-proxy-headers');
  }

  public async toggleSetting(optionName: optionNames): Promise<void> {
    const option = this.getOptionCheckbox(optionName);
    await option.click();
  }

  public async setOptionValue(
    optionName: optionNames,
    value: string
  ): Promise<void> {
    const option = this.getOptionInput(optionName);
    await utils.setElementValue(option, value);
  }

  public getOptionCheckbox(
    optionName: optionNames
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-environment-proxy input[formcontrolname=${optionName}] + label`
    );
  }

  private getOptionInput(
    optionName: optionNames
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(`app-environment-proxy input[formcontrolname=${optionName}]`);
  }
}

export default new EnvironmentsProxy();
