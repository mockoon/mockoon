import { EnvironmentLogsTabsNameType } from '../../src/renderer/app/models/store.model';
import navigation from '../libs/navigation';
import utils, { DropdownMenuLogsActions } from '../libs/utils';

/**
 * Requires a switch to the settings view
 */
class EnvironmentsLogs {
  public get container() {
    return $('.environment-logs');
  }

  public get startRecordingBtn() {
    return $('.environment-logs-header button#start-recording');
  }

  public getMetadataIcon(logIndex: number) {
    return $(
      `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .nav-link div div:first-of-type div:nth-of-type(3) .logs-metadata`
    );
  }

  public async select(index: number) {
    await $(
      `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${index})`
    ).click();
  }

  /**
   * Assert number of entries and tab tag
   *
   * @param expected
   */
  public async assertCount(expected: number) {
    await utils.countElements(
      $$('.environment-logs-column:nth-child(1) .menu-list .nav-item'),
      expected
    );

    if (expected === 0) {
      await navigation.assertHeaderValue('ENV_LOGS', 'Logs');
    } else {
      await navigation.assertHeaderValue('ENV_LOGS', `Logs ${expected}`);
    }
  }

  public async assertActiveLogEntry(index: number) {
    await $(
      `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${index}) .nav-link.active`
    ).waitForExist();
  }

  public async assertLogMenu(logIndex: number, method: string, path?: string) {
    const menuItemSelector = `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .nav-link`;
    const methodSelector = `${menuItemSelector} .route-method`;
    const pathSelector = `${menuItemSelector} .nav-link-label`;

    await $(menuItemSelector).waitForExist();
    await utils.assertElementText($(methodSelector), method);

    if (path) {
      await utils.assertElementText($(pathSelector), path);
    }
  }

  public async assertLogMenuIcon(
    logIndex: number,
    icon: 'PROXY' | 'CAUGHT',
    reverse = false
  ) {
    await $(
      `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .nav-link app-svg[icon="${
        icon === 'PROXY' ? 'security' : 'check'
      }"]`
    ).waitForExist({ reverse });
  }

  public async assertLogItem(
    text: string,
    tab: 'request' | 'response',
    sectionIndex: number,
    itemIndex: number
  ) {
    const selector = `.environment-logs-content-${tab} div:nth-child(${sectionIndex}) div.environment-logs-content-item:nth-child(${itemIndex})`;

    await $(selector).waitForExist();
    await utils.assertElementText($(selector), text);
  }

  public async assertLogBody(text: string, tab: 'request' | 'response') {
    const selector = `.environment-logs-content-${tab} div:nth-child(${tab === 'request' ? '10' : '6'}) .ace_content`;

    await $(selector).waitForExist();
    await utils.assertElementText($(selector), text);
  }

  public async assertLogItemTitle(
    text: string,
    tab: 'request' | 'response',
    sectionIndex: number
  ) {
    const selector = `.environment-logs-content-${tab} > div:nth-child(${sectionIndex})`;

    await $(selector).waitForExist();
    const elementText = (await $(selector).getText()).trim();

    expect(elementText).toEqual(text);
  }

  public async switchTab(tabName: EnvironmentLogsTabsNameType) {
    const selectors: { [key in typeof tabName]: string } = {
      REQUEST:
        '.environment-logs-content .nav.nav-tabs .nav-item:nth-child(1) .nav-link',
      RESPONSE:
        '.environment-logs-content .nav.nav-tabs .nav-item:nth-child(2) .nav-link'
    };

    await $(selectors[tabName]).click();
  }

  public async clickMockButton(logIndex: number) {
    await utils.dropdownMenuClick(
      `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .nav-link`,
      DropdownMenuLogsActions.MOCK
    );
  }

  public async assertViewBodyLogButtonPresence(reverse = false) {
    await $('.view-body-link').waitForExist({ reverse });
  }

  public async clickViewBodyLogButton() {
    await $('.view-body-link').click();
  }

  public async startRecording() {
    const selector = this.startRecordingBtn;

    await selector.click();
  }

  public async stopRecording() {
    const selector = $('.environment-logs-header button#stop-recording');

    await selector.click();
  }

  public async clear() {
    const selector = $('.environment-logs-header button#clear-logs');
    // click twice to confirm (cannot double click)
    await selector.click();
    await selector.click();
  }
}

export default new EnvironmentsLogs();
