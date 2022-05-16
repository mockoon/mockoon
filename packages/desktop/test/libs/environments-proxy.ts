import { ChainablePromiseElement } from 'webdriverio';
import utils from '../libs/utils';

type optionNames = 'proxyHost';

/**
 * Requires a switch to the proxy view
 */
class EnvironmentsProxy {
  public async setOptionValue(
    optionName: optionNames,
    value: string
  ): Promise<void> {
    const option = this.getOptionInput(optionName);
    await utils.setElementValue(option, value);
  }

  private getOptionInput(
    optionName: optionNames
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(`app-environment-proxy input[formcontrolname=${optionName}]`);
  }
}

export default new EnvironmentsProxy();
