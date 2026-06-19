import { Environment, Route } from '@mockoon/commons';
import { resolve } from 'path';
import {
  clickMenu,
  mockSaveDialog,
  readClipboard
} from '../libs/electron-mocks';
import environments from '../libs/environments';
import file from '../libs/file';
import routes from '../libs/routes';
import utils, {
  DropdownMenuEnvironmentActions,
  DropdownMenuRouteActions
} from '../libs/utils';

describe('Clipboard copy', () => {
  it('should open the environment with routes', async () => {
    await environments.open('clipboard-copy');
  });

  describe('Copy environment to the clipboard', () => {
    it('should copy the environment to clipboard', async () => {
      await utils.dropdownMenuClick(
        `.environments-menu div:first-of-type .nav-item:nth-child(${1}) .nav-link`,
        DropdownMenuEnvironmentActions.COPY_JSON
      );

      const clipboardContent = await readClipboard();
      const environmentCopy: Environment = JSON.parse(clipboardContent);

      await utils.checkToastDisplayed(
        'success',
        'Environment has been successfully copied to the clipboard'
      );
      file.verifyObjectProperty(
        environmentCopy,
        ['name'],
        ['Env clipboard copy']
      );
    });

    it('should create a new environment from clipboard', async () => {
      await mockSaveDialog(
        resolve('./tmp/storage/new-env-clipboard-copy.json')
      );

      await clickMenu('MENU_NEW_ENVIRONMENT_CLIPBOARD');
      await browser.pause(500);

      await environments.assertCount(2);
      await environments.assertActiveMenuEntryText('Env clipboard copy');

      await environments.close(2);
    });
  });

  describe('Copy route to the clipboard', () => {
    it('should copy route JSON to clipboard', async () => {
      await utils.dropdownMenuClick(
        `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
        DropdownMenuRouteActions.COPY_JSON
      );

      const clipboardContent = await readClipboard();
      const routeCopy: Route = JSON.parse(clipboardContent);

      await utils.checkToastDisplayed(
        'success',
        'Route has been successfully copied to the clipboard'
      );
      file.verifyObjectProperty(
        routeCopy,
        ['method', 'endpoint'],
        ['get', 'answer']
      );
    });

    it('should create a route from clipboard and add it to the active environment', async () => {
      await clickMenu('MENU_NEW_ROUTE_CLIPBOARD');
      await browser.pause(500);

      await environments.assertCount(1);
      await environments.assertActiveMenuEntryText('Env clipboard copy');
      await routes.assertCount(2);
      await routes.assertActiveMenuEntryText('/answer\nGET');

      await environments.close(1);
    });

    it('should create a route from clipboard and create a new environment if no environment is open', async () => {
      await environments.assertCount(0);
      await mockSaveDialog(
        resolve('./tmp/storage/new-environment-route-clipboard.json')
      );

      await clickMenu('MENU_NEW_ROUTE_CLIPBOARD');
      await browser.pause(500);

      await environments.assertCount(1);
      await environments.assertActiveMenuEntryText(
        'New environment route clipboard'
      );
      await routes.assertCount(1);
      await routes.assertActiveMenuEntryText('/answer\nGET');
    });

    it('should copy the full route path to the clipboard', async () => {
      await utils.dropdownMenuClick(
        `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
        DropdownMenuRouteActions.COPY_PATH
      );
      const clipboardContent = await readClipboard();

      expect(clipboardContent).toEqual('http://localhost:3000/answer');
    });
  });
});
