import { ChainablePromiseElement } from 'webdriverio';
import utils from '../libs/utils';

type Targets = 'environments' | 'routes' | 'databuckets';

export enum ContextMenuEnvironmentActions {
  DUPLICATE = 1,
  COPY_JSON = 2,
  SHOW_FOLDER = 3,
  MOVE_FOLDER = 4,
  CLOSE = 5
}

export enum ContextMenuDatabucketActions {
  DUPLICATE = 1,
  DUPLICATE_TO_ENV = 2,
  COPY_ID = 3,
  DELETE = 4
}

export enum ContextMenuRouteActions {
  DUPLICATE = 1,
  DUPLICATE_TO_ENV = 2,
  COPY_JSON = 3,
  COPY_PATH = 4,
  TOGGLE = 5,
  DELETE = 6
}

export enum ContextMenuFolderActions {
  ADD_CRUD = 1,
  ADD_HTTP = 2,
  ADD_FOLDER = 3,
  DELETE = 4
}

class ContextMenu {
  private targetSelectors = {
    environments: '.environments-menu',
    routes: '.routes-menu',
    databuckets: '.databuckets-menu'
  };

  public getItem(
    contextMenuItemIndex: number
  ): ChainablePromiseElement<WebdriverIO.Element> {
    return $(
      `.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`
    );
  }

  public async open(
    targetMenu: Targets,
    menuItemIndex?: number
  ): Promise<void> {
    await this.getMenuEntry(targetMenu, menuItemIndex).click({
      button: 'right'
    });
    await $('.context-menu').waitForExist();
  }

  public async close(): Promise<void> {
    await $('body').click({ x: 0, y: 0 });
  }

  public async click(
    targetMenu: Targets,
    menuItemIndex?: number,
    contextMenuItemIndex?:
      | ContextMenuEnvironmentActions
      | ContextMenuRouteActions
      | ContextMenuFolderActions
      | ContextMenuDatabucketActions
  ) {
    await this.open(targetMenu, menuItemIndex);
    await this.getItem(contextMenuItemIndex).click();
  }

  public async assertEntryEnabled(
    targetMenu: Targets,
    menuItemIndex: number,
    contextMenuItemIndex: number,
    reverse = true
  ) {
    await this.open(targetMenu, menuItemIndex);
    await utils.assertHasClass(
      this.getItem(contextMenuItemIndex),
      'disabled',
      reverse
    );
  }

  public async assertEntryDisabled(
    targetMenu: Targets,
    menuItemIndex: number,
    contextMenuItemIndex: number,
    reverse = false
  ) {
    await this.open(targetMenu, menuItemIndex);
    await utils.assertHasClass(
      this.getItem(contextMenuItemIndex),
      'disabled',
      reverse
    );
  }

  public async clickAndConfirm(
    targetMenu: Targets,
    menuItemIndex?: number,
    contextMenuItemIndex?: number
  ) {
    await this.open(targetMenu, menuItemIndex);
    await this.getItem(contextMenuItemIndex).click();
    await this.getItem(contextMenuItemIndex).click();
  }

  private getMenuEntry(
    targetMenu: Targets,
    menuItemIndex?: number
  ): ChainablePromiseElement<WebdriverIO.Element> {
    const itemSelector =
      menuItemIndex === undefined
        ? ' .nav-link.active'
        : `:nth-child(${menuItemIndex})`;

    return $(
      `${this.targetSelectors[targetMenu]} .menu-list .nav-item${itemSelector}`
    );
  }
}

export default new ContextMenu();
