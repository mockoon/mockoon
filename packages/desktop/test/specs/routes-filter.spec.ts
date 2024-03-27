import { resolve } from 'path';
import contextMenu, { ContextMenuRouteActions } from '../libs/context-menu';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import routes from '../libs/routes';

describe('Routes filter', () => {
  it('should open and start the environment', async () => {
    await environments.open('basic-data');
    await environments.start();
  });

  it('should get focused when pressing ctrl + shift + f', async () => {
    await browser.keys([
      process.platform === 'darwin' ? 'Command' : 'Control',
      'Shift',
      'f'
    ]);
    expect(await routes.filter.isFocused()).toEqual(true);
  });

  it('should get cleared when pressing escape while focused', async () => {
    await routes.setFilter('dolphins');
    await routes.filter.click();
    await browser.keys(['Escape']);
    await browser.pause(500);
    await routes.assertFilter('');
  });

  it('should filter route by name dolphins', async () => {
    await routes.assertCount(3);
    await routes.setFilter('/dolphins');
    await browser.pause(500);
    await routes.assertCount(1);
  });

  it('should filter route by multiple words (dolphin + post)', async () => {
    await routes.clearFilter();
    await browser.pause(500);
    await routes.assertCount(3);
    await routes.setFilter('dolphins post');
    await browser.pause(500);
    await routes.assertCount(1);
  });

  it('should filter route by method', async () => {
    await routes.clearFilter();
    await browser.pause(500);
    await routes.assertCount(3);
    await routes.setFilter('post');
    await browser.pause(500);
    await routes.assertCount(1);
  });

  it('should reset routes filter when clicking on the button Clear filter', async () => {
    await routes.clearFilter();
    await browser.pause(500);
    await routes.assertCount(3);
  });

  it('should reset routes filter when adding a new route', async () => {
    await routes.setFilter('/dolphins');
    await routes.addHTTPRoute();
    await routes.assertFilter('');
  });

  it('should reset routes filter when switching env', async () => {
    await routes.setFilter('/dolphins');
    await dialogs.save(resolve('./tmp/storage/dup-env1-test.json'));
    await environments.duplicate(1);
    await routes.assertFilter('');
  });

  it('should reset routes filter when duplicating route to selected environment', async () => {
    await environments.select(1);
    await routes.setFilter('/dolphins');
    await browser.pause(500);
    await routes.assertCount(1);
    // menu item id is still 3, as filtering is using d-none class
    await contextMenu.click(
      'routes',
      3,
      ContextMenuRouteActions.DUPLICATE_TO_ENV
    );
    await $(
      '.modal-content .modal-body .list-group .list-group-item:first-child'
    ).click();
    await routes.assertFilter('');
  });

  it('should reset routes filter when adding a new environment', async () => {
    await routes.setFilter('/dolphins');
    await environments.add('new-env1-test');
    await routes.assertFilter('');
  });

  it('should reset routes filter when removing environment', async () => {
    await routes.setFilter('/dolphins');
    await environments.close(3);
    await routes.assertFilter('');
  });
});
