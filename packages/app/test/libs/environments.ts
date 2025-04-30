import { resolve } from 'path';
import dialogs from '../libs/dialogs';
import utils, { DropdownMenuEnvironmentActions } from '../libs/utils';

class Environments {
  private activeMenuEntrySelector =
    '.environments-menu .nav-item .nav-link.active';

  public get recordingIndicator() {
    return $(`${this.activeMenuEntrySelector} app-svg[icon="record"]`);
  }

  public get addBtn() {
    return $('#local-environments-add-dropdown .dropdown-toggle');
  }

  private get startBtn() {
    return $('#header-btn-server-start');
  }

  private get stopBtn() {
    return $('#header-btn-server-stop');
  }

  private get restartBtn() {
    return $('#header-btn-server-restart');
  }

  private get runningEnvironmentMenuEntry() {
    return $(
      '.environments-menu .menu-list .nav-item .nav-link.active .nav-link-subtitle app-svg[icon="computer"].text-success'
    );
  }

  private get activeEnvironmentMenuEntry() {
    return $(this.activeMenuEntrySelector);
  }

  public getAddMenuEntry(index: number) {
    return $(
      `#local-environments-add-dropdown-menu .dropdown-item:nth-child(${index})`
    );
  }

  public async add(environmentName: string) {
    await dialogs.save(resolve(`./tmp/storage/${environmentName}.json`));
    await this.addBtn.click();
    await this.getAddMenuEntry(1).click();
    await utils.closeTooltip();
  }

  /**
   * Open the environment add menu
   */
  public async openAddMenu(): Promise<void> {
    await this.addBtn.click();
  }

  /**
   * Mock openFile dialog
   */
  public async open(
    environmentName: string,
    assertActive = true
  ): Promise<void> {
    await dialogs.open(resolve(`./tmp/storage/${environmentName}.json`));

    await this.addBtn.click();
    await this.getAddMenuEntry(2).click();

    await utils.closeTooltip();

    if (assertActive) {
      const activeEnvironment = await this.activeEnvironmentMenuEntry;
      await activeEnvironment.waitForExist();
    }

    await browser.pause(100);
  }

  public async select(environmentIndex: number): Promise<void> {
    await $(
      `.environments-menu .menu-list .nav-item:nth-child(${environmentIndex}) .nav-link`
    ).click();
  }

  public async close(index: number): Promise<void> {
    await utils.dropdownMenuClick(
      `.environments-menu div:first-of-type .nav-item:nth-child(${index}) .nav-link`,
      DropdownMenuEnvironmentActions.CLOSE
    );

    await browser.pause(500);
  }

  public async duplicate(index: number) {
    await utils.dropdownMenuClick(
      `.environments-menu div:first-of-type .nav-item:nth-child(${index}) .nav-link`,
      DropdownMenuEnvironmentActions.DUPLICATE
    );
  }

  public async start(): Promise<void> {
    await this.startBtn.click();
    await utils.closeTooltip();
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
        `${this.activeMenuEntrySelector} .nav-link-subtitle app-svg[icon="lock"]`
      ).isExisting()
    ).toEqual(reverse ? false : true);
  }

  public async assertMenuProxyIconVisible(reverse = false): Promise<void> {
    const condition = expect(
      await $(
        `${this.activeMenuEntrySelector} app-svg[icon="security"]`
      ).isExisting()
    );

    condition.toEqual(reverse ? false : true);
  }

  public async assertMenuRecordingIconVisible(reverse = false): Promise<void> {
    const condition = expect(
      await $(
        `${this.activeMenuEntrySelector} app-svg[icon="record"]`
      ).isExisting()
    );

    condition.toEqual(reverse ? false : true);
  }

  public async assertNeedsRestart() {
    await $(
      '.environments-menu .menu-list .nav-item .nav-link.active .nav-link-subtitle app-svg[icon="computer"].text-orange'
    ).waitForExist();
  }

  public async assertStarted() {
    await this.runningEnvironmentMenuEntry.waitForExist();
  }
}

export default new Environments();
