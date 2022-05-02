import { ChainablePromiseElement } from 'webdriverio';
import utils from '../libs/utils';

type Targets = 'environments' | 'routes';

class ContextMenu {
  private targetSelectors = {
    environments: '.environments-menu',
    routes: '.routes-menu'
  };

  public async openContextMenu(
    targetMenu: Targets,
    menuItemIndex?: number
  ): Promise<void> {
    await this.getMenuEntry(targetMenu, menuItemIndex).click({
      button: 'right'
    });
    await $('.context-menu').waitForExist();
  }

  public async closeContextMenu(): Promise<void> {
    await $('body').click({ x: 0, y: 0 });
  }

  public async click(
    targetMenu: Targets,
    menuItemIndex?: number,
    contextMenuItemIndex?: number
  ) {
    await this.openContextMenu(targetMenu, menuItemIndex);
    await $(
      `.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`
    ).click();
  }

  public async assertEntryDisabled(
    targetMenu: Targets,
    menuItemIndex: number,
    contextMenuItemIndex: number,
    reverse = false
  ) {
    await this.openContextMenu(targetMenu, menuItemIndex);
    await utils.assertHasClass(
      $(`.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`),
      'disabled',
      reverse
    );
  }

  public async clickAndConfirm(
    targetMenu: Targets,
    menuItemIndex?: number,
    contextMenuItemIndex?: number
  ) {
    await this.openContextMenu(targetMenu, menuItemIndex);
    await $(
      `.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`
    ).click();
    await $(
      `.context-menu .context-menu-item:nth-child(${contextMenuItemIndex})`
    ).click();
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
