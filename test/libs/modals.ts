import { ChainablePromiseElement } from 'webdriverio';

class Modals {
  private get closeBtn(): ChainablePromiseElement<
    Promise<WebdriverIO.Element>
  > {
    return $('.modal-dialog .modal-footer button');
  }

  private get title(): ChainablePromiseElement<Promise<WebdriverIO.Element>> {
    return $('.modal-title');
  }

  public async close() {
    await this.closeBtn.click();
  }

  public async assertTitle(expectedTitle: string): Promise<void> {
    const text = await this.title.getText();
    expect(text).toContain(expectedTitle);
  }

  public async assertExists(): Promise<void> {
    await $('.modal').waitForExist();
  }
}

export default new Modals();
