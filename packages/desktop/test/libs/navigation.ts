import { ChainablePromiseElement } from '@wdio/globals/node_modules/webdriverio';
import { ViewsNameType } from '../../src/renderer/app/models/store.model';
import utils from '../libs/utils';

class Navigation {
  private tabIndexes: {
    ENV_ROUTES: number;
    ENV_DATABUCKETS: number;
    ENV_HEADERS: number;
    ENV_CALLBACKS: number;
    ENV_LOGS: number;
    ENV_PROXY: number;
    ENV_SETTINGS: number;
  } = {
    ENV_ROUTES: 1,
    ENV_DATABUCKETS: 2,
    ENV_HEADERS: 3,
    ENV_CALLBACKS: 4,
    ENV_LOGS: 5,
    ENV_PROXY: 6,
    ENV_SETTINGS: 7
  };

  public get routesTab(): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-header .header .nav .nav-item:nth-child(${this.tabIndexes['ENV_ROUTES']}) .nav-link`
    );
  }

  public get databucketsTab(): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-header .header .nav .nav-item:nth-child(${this.tabIndexes['ENV_DATABUCKETS']}) .nav-link`
    );
  }

  public get callbacksTab(): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-header .header .nav .nav-item:nth-child(${this.tabIndexes['ENV_CALLBACKS']}) .nav-link`
    );
  }

  public get logsTab(): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-header .header .nav .nav-item:nth-child(${this.tabIndexes['ENV_LOGS']}) .nav-link`
    );
  }

  public get headersTab(): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-header .header .nav .nav-item:nth-child(${this.tabIndexes['ENV_HEADERS']}) .nav-link`
    );
  }

  public get proxyTab(): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-header .header .nav .nav-item:nth-child(${this.tabIndexes['ENV_PROXY']}) .nav-link`
    );
  }

  public get settingsTab(): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `app-header .header .nav .nav-item:nth-child(${this.tabIndexes['ENV_SETTINGS']}) .nav-link`
    );
  }

  public async switchView(viewName: ViewsNameType): Promise<void> {
    await $(
      `.header .nav .nav-item:nth-child(${this.tabIndexes[viewName]}) .nav-link`
    ).click();
    await browser.pause(100);
  }

  public async assertActiveTab(viewName: ViewsNameType): Promise<void> {
    switch (viewName) {
      case 'ENV_DATABUCKETS':
        await utils.assertHasClass(this.databucketsTab, 'active');
        break;

      case 'ENV_ROUTES':
        await utils.assertHasClass(this.routesTab, 'active');
        break;

      case 'ENV_CALLBACKS':
        await utils.assertHasClass(this.callbacksTab, 'active');
        break;

      case 'ENV_HEADERS':
        await utils.assertHasClass(this.headersTab, 'active');
        break;

      case 'ENV_LOGS':
        await utils.assertHasClass(this.logsTab, 'active');
        break;
    }
  }

  public async assertHeaderValue(
    viewName: ViewsNameType,
    value: string
  ): Promise<void> {
    switch (viewName) {
      case 'ENV_DATABUCKETS':
        await utils.assertElementText(this.databucketsTab, value, true);
        break;

      case 'ENV_ROUTES':
        await utils.assertElementText(this.routesTab, value, true);
        break;

      case 'ENV_CALLBACKS':
        await utils.assertElementText(this.callbacksTab, value, true);
        break;

      case 'ENV_HEADERS':
        await utils.assertElementText(this.headersTab, value, true);
        break;

      case 'ENV_LOGS':
        await utils.assertElementText(this.logsTab, value, true);
        break;
    }
  }
}

export default new Navigation();
