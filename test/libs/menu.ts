import electronMock from '../libs/electron-mock';

type MenuId =
  | 'EXPORT_FILE'
  | 'EXPORT_FILE_SELECTED'
  | 'IMPORT_FILE'
  | 'IMPORT_CLIPBOARD'
  | 'IMPORT_OPENAPI_FILE'
  | 'OPEN_SETTINGS'
  | 'EXPORT_OPENAPI_FILE';

class Menu {
  public async click(menuId: MenuId) {
    await electronMock.call(`/menu#${menuId}#`);
  }
}

export default new Menu();
