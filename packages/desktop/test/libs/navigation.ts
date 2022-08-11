import { ViewsNameType } from '../../src/renderer/app/models/store.model';
import environments from '../libs/environments';
import utils from '../libs/utils';

class Navigation {
  private tabIndexes: {
    ENV_ROUTES: number;
    ENV_DATABUCKETS: number;
    ENV_HEADERS: number;
    ENV_LOGS: number;
    ENV_PROXY: number;
    ENV_SETTINGS: number;
  } = {
    ENV_ROUTES: 1,
    ENV_DATABUCKETS: 2,
    ENV_HEADERS: 3,
    ENV_LOGS: 4,
    ENV_PROXY: 5,
    ENV_SETTINGS: 6
  };

  public async switchView(viewName: ViewsNameType): Promise<void> {
    await $(
      `.header .nav .nav-item:nth-child(${this.tabIndexes[viewName]}) .nav-link`
    ).click();
    await browser.pause(100);
  }

  public async assertHeaderValue(
    viewName: ViewsNameType,
    value: string
  ): Promise<void> {
    switch (viewName) {
      case 'ENV_DATABUCKETS':
        await utils.assertElementText(environments.databucketsTab, value);
        break;

      case 'ENV_ROUTES':
        await utils.assertElementText(environments.routesTab, value);
        break;

      case 'ENV_HEADERS':
        await utils.assertElementText(environments.headersTab, value);
        break;

      case 'ENV_LOGS':
        await utils.assertElementText(environments.logsTab, value);
        break;
    }
  }
}

export default new Navigation();
