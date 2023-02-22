import { resolve } from 'path';
import { ChainablePromiseElement } from 'webdriverio';
import contextMenu, {
  ContextMenuEnvironmentActions
} from '../libs/context-menu';
import dialogs from '../libs/dialogs';
import utils from '../libs/utils';

class Environments {
  private activeMenuEntrySelector =
    '.environments-menu .nav-item .nav-link.active';

  public get openBtn(): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      '.environments-menu .nav:first-of-type .nav-item .nav-link.open-environment'
    );
  }

  private get startBtn(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('.btn[ngbtooltip="Start server"]');
  }

  private get stopBtn(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('.btn[ngbtooltip="Stop server"]');
  }

  private get restartBtn(): ChainablePromiseElement<WebdriverIO.Element> {
    return $('.btn[ngbtooltip="Server needs restart"]');
  }

  private get runningEnvironmentMenuEntry(): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      '.environments-menu .menu-list .nav-item .nav-link.active.running'
    );
  }

  private get environmentMenuEntry(): ChainablePromiseElement<WebdriverIO.Element> {
    return $(this.activeMenuEntrySelector);
  }

  private get activeEnvironmentMenuEntry(): ChainablePromiseElement<WebdriverIO.Element> {
    return $(this.activeMenuEntrySelector);
  }

  public async add() {
    await $(
      '.environments-menu .nav:first-of-type .nav-item .nav-link.add-environment'
    ).click();
  }

  /**
   * Mock openFile dialog
   */
  public async open(
    environmentName: string,
    assertActive = true
  ): Promise<void> {
    await dialogs.open(resolve(`./tmp/storage/${environmentName}.json`));
    await this.openBtn.click();

    if (assertActive) {
      const activeEnvironment = await this.activeEnvironmentMenuEntry;
      await activeEnvironment.waitForExist();
    }
  }

  public async select(environmentIndex: number): Promise<void> {
    await $(
      `.environments-menu .menu-list .nav-item:nth-child(${environmentIndex}) .nav-link`
    ).click();
  }

  public async close(index: number): Promise<void> {
    await contextMenu.click(
      'environments',
      index,
      ContextMenuEnvironmentActions.CLOSE
    );
    await browser.pause(500);
  }

  public async duplicate(index: number) {
    await contextMenu.click(
      'environments',
      index,
      ContextMenuEnvironmentActions.DUPLICATE
    );
  }

  public async start(): Promise<void> {
    await this.startBtn.click();
    await this.runningEnvironmentMenuEntry.waitForExist();
  }

  public async stop(): Promise<void> {
    await this.stopBtn.click();
    await this.runningEnvironmentMenuEntry.waitForExist({ reverse: true });
  }

  public async restart(): Promise<void> {
    await this.restartBtn.click();
    await this.runningEnvironmentMenuEntry.waitForExist();
  }

  public async assertCount(expected: number) {
    await utils.countElements(
      $$('.environments-menu .menu-list .nav-item'),
      expected
    );
  }

  public async assertMenuEntryText(
    entryIndex: number,
    expectedName: string,
    expectedHostnamePort?: string
  ): Promise<void> {
    const text = await $(
      `.environments-menu .menu-list .nav-item:nth-child(${entryIndex}) .nav-link`
    ).getText();
    expect(text).toContain(expectedName);

    if (expectedHostnamePort) {
      expect(text).toContain(expectedHostnamePort);
    }
  }
  public async assertActiveMenuEntryText(expectedName: string): Promise<void> {
    const text = await this.activeEnvironmentMenuEntry.getText();
    expect(text).toContain(expectedName);
  }

  public async assertMenuHTTPSIconPresent(reverse = false): Promise<void> {
    expect(
      await $(
        `${this.activeMenuEntrySelector} .nav-link-subtitle app-svg[icon="https"]`
      ).isExisting()
    ).toEqual(reverse ? false : true);
  }

  public async assertMenuProxyIconVisible(reverse = false): Promise<void> {
    expect(
      await $(
        `${this.activeMenuEntrySelector} app-svg[icon="security"]${
          reverse ? '.invisible' : '.visible'
        }`
      ).isExisting()
    ).toEqual(true);
  }

  public async assertNeedsRestart() {
    await $(
      '.environments-menu .menu-list .nav-item .nav-link.active.need-restart'
    ).waitForExist();
  }
}

export default new Environments();
