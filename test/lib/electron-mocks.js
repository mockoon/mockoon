const electron = require('electron');
const dialog = electron.dialog;
const ipcMain = electron.ipcMain;

/**
 * Mock injected during the tests.
 * Use it to prepare the return value of a dialog's method.
 */
ipcMain.on('SPECTRON_FAKE_DIALOG', (channel, options) => {
  dialog[options.method] = async () => options.value;
  channel.returnValue = true;
});
