import electronMock from '../libs/electron-mock';

type MenuId =
  | 'MENU_NEW_ENVIRONMENT_CLIPBOARD'
  | 'MENU_NEW_ROUTE_CLIPBOARD'
  | 'MENU_OPEN_SETTINGS'
  | 'MENU_IMPORT_OPENAPI_FILE'
  | 'MENU_EXPORT_OPENAPI_FILE';

class Menu {
  public async click(menuId: MenuId) {
    await electronMock.call(`/menu#${menuId}#`);
  }
}

export default new Menu();
