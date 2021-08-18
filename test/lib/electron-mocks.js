const electron = require('electron');
const dialog = electron.dialog;
const ipcMain = electron.ipcMain;

const values = {};

/**
 * Mock injected during the tests.
 * Use it to prepare the return value of a dialog's method.
 */
ipcMain.on('SPECTRON_FAKE_DIALOG', (channel, options) => {
  values[options.method] = options.values;
  dialog[options.method] = async () => values[options.method].shift();
  channel.returnValue = true;
});
