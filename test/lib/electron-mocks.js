const electron = require('electron');
const dialog = electron.dialog;
const ipcMain = electron.ipcMain;

function mock(options) {
  options.forEach((option) => {
    if (dialog[option.method]) {
      dialog[option.method] = option.method.toLowerCase().endsWith('sync')
        ? () => option.value
        : async () => option.value;
    } else {
      throw new Error(`Can't find ${option.method} on dialog module.`);
    }
  });
}

ipcMain.on('SPECTRON_FAKE_DIALOG', (channel, options) => {
  mock(options);
  channel.returnValue = true;
});
