import { ChainablePromiseElement } from 'webdriverio';
import utils from '../libs/utils';

class Modals {
  private envNameSelector =
    '.modal-content .modal-body .list-group .list-group-item:first-child div:first-of-type';
  private envHostnameSelector =
    '.modal-content .modal-body .list-group .list-group-item:first-child div:last-of-type';

  private get confirmBtn(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('.modal-dialog .modal-footer button:first-of-type');
  }
  private get cancelBtn(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('.modal-dialog .modal-footer button:last-of-type');
  }

  private get closeBtn(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('.modal-dialog .modal-footer button');
  }

  private get title(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('.modal-title');
  }

  // close a modal with only one button (settings, welcome, etc)
  public async close() {
    await this.closeBtn.click();
  }

  // confirm the confirm modal
  public async confirm() {
    await this.confirmBtn.click();
  }

  // cancel the confirm modal
  public async cancel() {
    await this.cancelBtn.click();
  }

  public async confirmDuplicateToEnvModal(envIndex: number) {
    await $(
      `.modal-content .modal-body .list-group .list-group-item:nth-child(${envIndex}) div:first-of-type`
    ).click();
  }

  public async assertTitle(expectedTitle: string): Promise<void> {
    const text = await this.title.getText();
    expect(text).toContain(expectedTitle);
  }

  public async assertExists(): Promise<void> {
    await $('.modal').waitForExist();
  }

  public async assertDuplicationModalEnvName(
    expectedName: string
  ): Promise<void> {
    await utils.assertElementText($(this.envNameSelector), expectedName);
  }

  public async assertDuplicationModalEnvHostname(
    expectedHostname: string
  ): Promise<void> {
    await utils.assertElementText(
      $(this.envHostnameSelector),
      expectedHostname
    );
  }
}

export default new Modals();
