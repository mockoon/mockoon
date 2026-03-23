import { resolve } from 'path';
import dialogs from '../libs/dialogs';
import environments from '../libs/environments';
import routes from '../libs/routes';
import utils from '../libs/utils';

const initialSpecPath = resolve(
  './test/data/res/reimport-openapi/initial.yaml'
);
const reimportSpecPath = resolve(
  './test/data/res/reimport-openapi/reimport.yaml'
);

const importInitialEnvironment = async () => {
  await environments.localAddFromOpenApi();
  await dialogs.open(initialSpecPath);
  await environments.browseOpenApi();
  await dialogs.save(resolve('./tmp/storage/reimport-openapi.json'));
  await environments.importOpenApi();
  await utils.waitForAutosave();

  await environments.assertActiveMenuEntryText('Reimport E2E Initial');
};

const openReimportPreview = async () => {
  await environments.reimportFromOpenApi(1);
  await dialogs.open(reimportSpecPath);
  await environments.browseOpenApi();

  await utils.waitForAutosave();

  const previewText = await $('.modal-content fieldset').getText();
  expect(previewText).toContain('1 new route(s) will be added');
  expect(previewText).toContain('1 new response(s) detected');
  expect(previewText).toContain('POST');
  expect(previewText).toContain('/items');
  expect(previewText).toContain('404');
};

const getRouteAndResponseCheckboxes = async () => {
  const routeCheckbox = await $(
    "//fieldset//li[contains(., 'POST') and contains(., '/items')]//input[@type='checkbox']"
  );
  const responseCheckbox = await $(
    "//fieldset//li[contains(., '404')]//input[@type='checkbox']"
  );

  return { routeCheckbox, responseCheckbox };
};

const assertGetRouteHasResponseCodes = async (expectedCodes: string[]) => {
  const routeTexts = await $$(
    '.routes-menu .menu-list .nav-item:not(.d-none) .nav-link'
  ).map((entry) => entry.getText());

  const getRouteIndex =
    routeTexts.findIndex(
      (text) => text.includes('GET') && text.includes('/items')
    ) + 1;
  expect(getRouteIndex).toBeGreaterThan(0);

  await routes.select(getRouteIndex);
  await routes.openRouteResponseMenu();

  const responseTexts = await $$(
    '.route-responses-dropdown-menu .dropdown-item'
  ).map((entry) => entry.getText());

  expectedCodes.forEach((expectedCode) => {
    expect(responseTexts.some((text) => text.includes(expectedCode))).toEqual(
      true
    );
  });

  await utils.closeTooltip();
};

describe('Swagger/OpenAPI reimport', () => {
  it('should import the initial OpenAPI spec with one route', async () => {
    await importInitialEnvironment();
    await routes.assertCount(1);

    const routeTexts = await $$(
      '.routes-menu .menu-list .nav-item:not(.d-none) .nav-link'
    ).map((entry) => entry.getText());
    expect(
      routeTexts.some((text) => text.includes('GET') && text.includes('/items'))
    ).toEqual(true);

    await assertGetRouteHasResponseCodes(['200']);
    await environments.close(1);
  });

  it('should not import unchecked new route but still import checked new response', async () => {
    await importInitialEnvironment();
    await routes.assertCount(1);

    await openReimportPreview();

    const { routeCheckbox, responseCheckbox } =
      await getRouteAndResponseCheckboxes();

    expect(await routeCheckbox.isSelected()).toEqual(true);
    expect(await responseCheckbox.isSelected()).toEqual(true);

    await routeCheckbox.click();
    expect(await routeCheckbox.isSelected()).toEqual(false);

    await environments.importOpenApi();
    await utils.waitForAutosave();

    await routes.assertCount(1);

    const routeTexts = await $$(
      '.routes-menu .menu-list .nav-item:not(.d-none) .nav-link'
    ).map((entry) => entry.getText());

    expect(
      routeTexts.some((text) => text.includes('GET') && text.includes('/items'))
    ).toEqual(true);
    expect(
      routeTexts.some(
        (text) => text.includes('POST') && text.includes('/items')
      )
    ).toEqual(false);

    await assertGetRouteHasResponseCodes(['200', '404']);
    await environments.close(1);
  });

  it('should import both new route and new response when both stay checked', async () => {
    await importInitialEnvironment();
    await routes.assertCount(1);

    await openReimportPreview();

    const { routeCheckbox, responseCheckbox } =
      await getRouteAndResponseCheckboxes();

    expect(await routeCheckbox.isSelected()).toEqual(true);
    expect(await responseCheckbox.isSelected()).toEqual(true);

    await environments.importOpenApi();
    await utils.waitForAutosave();

    await routes.assertCount(2);

    const routeTexts = await $$(
      '.routes-menu .menu-list .nav-item:not(.d-none) .nav-link'
    ).map((entry) => entry.getText());

    expect(
      routeTexts.some((text) => text.includes('GET') && text.includes('/items'))
    ).toEqual(true);
    expect(
      routeTexts.some(
        (text) => text.includes('POST') && text.includes('/items')
      )
    ).toEqual(true);

    await assertGetRouteHasResponseCodes(['200', '404']);
    await environments.close(1);
  });
});
