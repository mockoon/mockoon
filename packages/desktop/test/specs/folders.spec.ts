import environments from '../libs/environments';
import file from '../libs/file';
import routes from '../libs/routes';
import utils, {
  DropdownMenuFolderActions,
  DropdownMenuRouteActions
} from '../libs/utils';

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

  it('should collapse the folder and verify the settings', async () => {
    await routes.collapse(1);
    await utils.waitForAutosave();
    const envUuid = await file.getObjectPropertyInFile(
      './tmp/storage/empty.json',
      'uuid'
    );
    const folderUuid = await file.getObjectPropertyInFile(
      './tmp/storage/empty.json',
      'folders.0.uuid'
    );
    await file.verifyObjectPropertyInFile(
      './tmp/storage/settings.json',
      [`collapsedFolders.${envUuid}.0`],
      [folderUuid]
    );
    await utils.waitForAutosave();
  });

  it('should delete folder', async () => {
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
      DropdownMenuFolderActions.DELETE,
      true
    );
    await routes.assertCount(0);
  });

  it('should create a folder in a folder', async () => {
    await routes.addFolder();
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
      DropdownMenuFolderActions.ADD_FOLDER
    );

    await routes.assertCount(3);
    await routes.assertMenuEntryText(1, 'New folder');
    await routes.assertMenuEntryText(2, 'New folder');
    await routes.assertMenuEntryText(3, 'Folder is empty');
  });

  it('should create a route in a subfolder', async () => {
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${2}) .nav-link`,
      DropdownMenuFolderActions.ADD_HTTP
    );
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
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${3}) .nav-link`,
      DropdownMenuRouteActions.DUPLICATE
    );
    await routes.pathInput.setValue('/subroute2');
    await routes.assertCount(5);
    await routes.assertMenuEntryText(4, '/subroute2');

    await routes.assertRoutePaddingLevel(4, 3);
  });

  it('should not be able to delete non empty folder', async () => {
    await utils.dropdownMenuAssertDisabled(
      `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
      DropdownMenuFolderActions.DELETE
    );
  });

  it('should toggle all the routes inside the folder', async () => {
    await environments.open('basic-folder-2-routes');
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${1}) .nav-link`,
      DropdownMenuFolderActions.TOGGLE_FOLDER
    );

    await $(
      '.routes-menu .menu-list .nav-item .nav-link.active.route-disabled'
    ).waitForExist();
    await utils.waitForAutosave();
    await file.verifyObjectPropertyInFile(
      './tmp/storage/settings.json',
      ['disabledRoutes.c8cdc030-344f-452f-aec4-56ded95b440c.0'],
      ['8745c4cf-88bd-4960-8353-858ae80623a5']
    );
    await file.verifyObjectPropertyInFile(
      './tmp/storage/settings.json',
      ['disabledRoutes.c8cdc030-344f-452f-aec4-56ded95b440c.1'],
      ['7cad788c-433f-404e-bd0f-ca0bef288492']
    );
  });
});
