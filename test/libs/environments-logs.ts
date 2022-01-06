import { EnvironmentLogsTabsNameType } from '../../src/renderer/app/stores/store';
import utils from '../libs/utils';

/**
 * Requires a switch to the settings view
 */
class EnvironmentsLogs {
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
    const tabText = $(
      'app-header .header .nav .nav-item:nth-child(3) .nav-link'
    );
    if (expected === 0) {
      await utils.assertElementText(tabText, 'Logs');
    } else {
      await utils.assertElementText(tabText, `Logs ${expected}`);
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
    const pathSelector = `${menuItemSelector} .route`;

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

  public async assertLogItemTitle(
    text: string,
    tab: 'request' | 'response',
    sectionIndex: number
  ) {
    const selector = `.environment-logs-content-${tab} div:nth-child(${sectionIndex}) div:first-child`;

    await $(selector).waitForExist();
    const elementText = await $(selector).getText();
    expect(elementText).toContain(text);
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
    await $(
      `.environment-logs-column:nth-child(1) .menu-list .nav-item:nth-child(${logIndex}) .btn-mock`
    ).click();
  }

  public async assertViewBodyLogButtonPresence(reverse = false) {
    await $('.view-body-link').waitForExist({ reverse });
  }

  public async clickViewBodyLogButton() {
    await $('.view-body-link').click();
  }

  public async clickOpenBodyInEditorButton(tab: 'request' | 'response') {
    await $(
      `.environment-logs-content-${tab} .environment-logs-open-${tab}-body`
    ).click();
  }

  public async clear() {
    const selector = $('.environment-logs-content button.btn-link');
    // click twice to confirm (cannot double click)
    await selector.click();
    await selector.click();
  }
}

export default new EnvironmentsLogs();
