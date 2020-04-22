import { Tests } from 'test/lib/tests';

const tests = new Tests('migrations/incompatible');

describe('Environments incompatibility', () => {
  tests.runHooks();

  it('Should display the incompatible environment with special design', async () => {
    await tests.app.client.waitForExist(
      '.environments-menu .menu-list .nav-item:nth-child(1).pattern-danger'
    );
  });

  it('Should select the first compatible environment by default', async () => {
    await tests.helpers.checkEnvironmentSelected(2);
  });

  it('Should make incompatible environment not selectable', async () => {
    await tests.helpers.selectEnvironment(1);
    await tests.helpers.checkEnvironmentSelected(2);
  });

  it('Should disable the context menu', async () => {
    await tests.helpers.contextMenuOpen(
      '.environments-menu .menu-list .nav-item:nth-child(1) .nav-link'
    );

    await tests.app.client.waitForExist('.context-menu', 5000, true);
  });

  it('Should not select the incompatible environment if all other environment have been deleted', async () => {
    await tests.helpers.removeEnvironment(2);
    await tests.helpers.checkNoEnvironmentSelected();
  });
});
