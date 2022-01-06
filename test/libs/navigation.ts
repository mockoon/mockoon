import { ViewsNameType } from '../../src/renderer/app/stores/store';

class Navigation {
  public async switchView(viewName: ViewsNameType): Promise<void> {
    const tabIndexes = {
      ENV_ROUTES: 1,
      ENV_HEADERS: 2,
      ENV_LOGS: 3,
      ENV_PROXY: 4,
      ENV_SETTINGS: 5
    };
    await $(
      `.header .nav .nav-item:nth-child(${tabIndexes[viewName]}) .nav-link`
    ).click();
    await browser.pause(100);
  }
}

export default new Navigation();
