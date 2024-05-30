import environments from '../libs/environments';
import headersUtils from '../libs/headers-utils';
import modals from '../libs/modals';
import navigation from '../libs/navigation';
import routes from '../libs/routes';
import utils, { DropdownMenuRouteActions } from '../libs/utils';

describe('Duplicate a route to an environment', async () => {
  it('should open the environment', async () => {
    await environments.open('basic-data');
  });

  it('should assert that menu entry is disabled when only one environment present', async () => {
    await utils.dropdownMenuAssertDisabled(
      `.routes-menu .nav-item:nth-child(${3}) .nav-link`,
      DropdownMenuRouteActions.DUPLICATE_TO_ENV
    );
  });

  it('should add a new environment and assert that menu entry is enabled', async () => {
    await environments.add('new-env-test');
    await environments.select(1);
    await utils.dropdownMenuAssertDisabled(
      `.routes-menu .nav-item:nth-child(${3}) .nav-link`,
      DropdownMenuRouteActions.DUPLICATE_TO_ENV,
      true
    );
  });

  it("should open duplication modal and verify selected route's information on modal", async () => {
    await utils.dropdownMenuClick(
      `.routes-menu .nav-item:nth-child(${3}) .nav-link`,
      DropdownMenuRouteActions.DUPLICATE_TO_ENV
    );

    await modals.assertExists();

    const targetRoute = await $('.modal-content .modal-title small').getText();

    expect(targetRoute).toContain('POST /dolphins');

    await modals.assertDuplicationModalEnvName('New env test');
    await modals.assertDuplicationModalEnvHostname('localhost:3001/');
  });

  it('should duplicate selected route to selected environment', async () => {
    await modals.confirmDuplicateToEnvModal(1);
    await routes.assertActiveMenuEntryText('/dolphins\nPOST');

    await navigation.switchView('ENV_SETTINGS');
    await environments.assertActiveMenuEntryText('New env test');
  });

  it('should duplicate selected route with the same properties', async () => {
    await navigation.switchView('ENV_ROUTES');

    await routes.assertMethod('POST');
    await routes.assertPath('dolphins');

    await routes.switchTab('HEADERS');

    await headersUtils.assertHeadersValues('route-response-headers', {
      'Content-Type': 'application/json'
    });
  });
});
