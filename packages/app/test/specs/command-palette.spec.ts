import commandPalette from '../libs/command-palette';
import environments from '../libs/environments';
import modals from '../libs/modals';
import settings from '../libs/settings';

describe('Command Palette', () => {
  it('should open and start the environment', async () => {
    await environments.open('basic-data');
  });

  it('should open the command palette when the shortcut is pressed', async () => {
    await commandPalette.open();
    await commandPalette.assertVisible();
  });

  it('should filter commands when text is entered into the search box', async () => {
    await commandPalette.search('Zoom');
    await commandPalette.countCommands(3);
  });

  it('should execute the selected command when it is clicked', async () => {
    await commandPalette.search('Open Application');
    await commandPalette.countCommands(3);
    await commandPalette.executeCommandClick(3);
    await commandPalette.assertVisible(true);
    await settings.assertVisible();
    await modals.close();
  });
});
