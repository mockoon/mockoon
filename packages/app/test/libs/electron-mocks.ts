export type MenuId =
  | 'MENU_NEW_ENVIRONMENT_CLIPBOARD'
  | 'MENU_NEW_ROUTE_CLIPBOARD'
  | 'MENU_OPEN_SETTINGS';

export const readClipboard = async () => {
  return await browser.electron.execute((electron) =>
    electron.clipboard.readText('clipboard')
  );
};

export const writeClipboard = async (text: string) => {
  await browser.electron.execute((electron, clipboardText) => {
    electron.clipboard.writeText(clipboardText, 'clipboard');
  }, text);
};

export const clickMenu = async (menuId: MenuId) => {
  await browser.electron.execute((electron, targetMenuId) => {
    electron.Menu.getApplicationMenu()?.getMenuItemById(targetMenuId)?.click();
  }, menuId);
};

export const mockOpenDialog = async (filePath: string) => {
  const mockedShowOpenDialog = await browser.electron.mock(
    'dialog',
    'showOpenDialog'
  );

  await mockedShowOpenDialog.mockResolvedValueOnce({
    canceled: false,
    filePaths: [filePath]
  });
};

export const mockSaveDialog = async (filePath: string) => {
  const mockedShowSaveDialog = await browser.electron.mock(
    'dialog',
    'showSaveDialog'
  );

  await mockedShowSaveDialog.mockResolvedValueOnce({
    canceled: false,
    filePath
  });
};
