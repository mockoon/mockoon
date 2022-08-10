import { ViewsNameType } from '../../src/renderer/app/models/store.model';

class Navigation {
  public async switchView(viewName: ViewsNameType): Promise<void> {
    const tabIndexes = {
      ENV_ROUTES: 1,
      ENV_DATABUCKETS: 2,
      ENV_HEADERS: 3,
      ENV_LOGS: 4,
      ENV_PROXY: 5,
      ENV_SETTINGS: 6
    };
    await $(
      `.header .nav .nav-item:nth-child(${tabIndexes[viewName]}) .nav-link`
    ).click();
    await browser.pause(100);
  }
}

export default new Navigation();
