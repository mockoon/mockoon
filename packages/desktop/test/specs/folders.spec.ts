import contextMenu, {
  ContextMenuFolderActions,
  ContextMenuRouteActions
} from '../libs/context-menu';
import environments from '../libs/environments';
import routes from '../libs/routes';

describe('Folders', () => {
  it('should open the environment', async () => {
    await environments.open('empty');
  });

  it("should create a folder and verify it's empty", async () => {
    await routes.addFolder();

    await routes.assertCount(2);
    await routes.assertMenuEntryText(1, 'New folder');
    await routes.assertMenuEntryText(2, 'Folder is empty');
  });

  it('should edit the folder name', async () => {
    await (await routes.getMenuItemEditable(1)).click();
    await routes.assertMenuItemEditable(1);
    await routes.setMenuItemEditableText(1, 'new name');
    await routes.assertMenuEntryText(1, 'new name');
  });

  it('should delete folder', async () => {
    await contextMenu.open('routes', 1);
    await contextMenu.clickAndConfirm(
      'routes',
      1,
      ContextMenuFolderActions.DELETE
    );
    await routes.assertCount(0);
  });

  it('should create a folder in a folder', async () => {
    await routes.addFolder();
    await contextMenu.open('routes', 1);
    await contextMenu.click('routes', 1, ContextMenuFolderActions.ADD_FOLDER);

    await routes.assertCount(3);
    await routes.assertMenuEntryText(1, 'New folder');
    await routes.assertMenuEntryText(2, 'New folder');
    await routes.assertMenuEntryText(3, 'Folder is empty');
  });

  it('should create a route in a subfolder', async () => {
    await contextMenu.open('routes', 2);
    await contextMenu.click('routes', 2, ContextMenuFolderActions.ADD_HTTP);
    await routes.pathInput.setValue('/subroute');
    await routes.assertCount(3);
    await routes.assertMenuEntryText(3, '/subroute');
  });

  it('should add a root level route', async () => {
    await routes.addHTTPRoute();
    await routes.pathInput.setValue('/rootroute');
    await routes.assertCount(4);
    await routes.assertMenuEntryText(4, '/rootroute');
  });

  it('should verify indentation', async () => {
    await routes.assertRoutePaddingLevel(1, 1);
    await routes.assertRoutePaddingLevel(2, 2);
    await routes.assertRoutePaddingLevel(3, 3);
    await routes.assertRoutePaddingLevel(4, 1);
  });

  it('should hide folders when filtering', async () => {
    await routes.setFilter('get');
    await browser.pause(100);
    await routes.assertCount(2);
    await routes.assertMenuEntryText(3, '/subroute');
    await routes.assertMenuEntryText(4, '/rootroute');
  });

  it('should duplicate the route in the subfolder', async () => {
    await contextMenu.open('routes', 3);
    await contextMenu.click('routes', 3, ContextMenuRouteActions.DUPLICATE);
    await routes.pathInput.setValue('/subroute2');
    await routes.assertCount(5);
    await routes.assertMenuEntryText(4, '/subroute2');

    await routes.assertRoutePaddingLevel(4, 3);
  });

  it('should delete subfolder and add route to parent folder', async () => {
    await routes.removeFolder(2);
    await routes.assertCount(4);

    await routes.assertMenuEntryText(1, 'New folder');
    await routes.assertMenuEntryText(2, '/subroute');
    await routes.assertMenuEntryText(3, '/subroute2');

    await routes.assertRoutePaddingLevel(1, 1);
    await routes.assertRoutePaddingLevel(2, 2);
    await routes.assertRoutePaddingLevel(3, 2);
  });

  it('should delete root folder and add routes to root level', async () => {
    await routes.removeFolder(1);
    await routes.assertCount(3);

    await routes.assertMenuEntryText(1, '/rootroute');
    await routes.assertMenuEntryText(2, '/subroute');
    await routes.assertMenuEntryText(3, '/subroute2');
    await routes.assertRoutePaddingLevel(1, 1);
    await routes.assertRoutePaddingLevel(2, 1);
    await routes.assertRoutePaddingLevel(3, 1);
  });
});
