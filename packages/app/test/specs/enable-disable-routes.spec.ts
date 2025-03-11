import environments from '../libs/environments';
import file from '../libs/file';
import http from '../libs/http';
import { HttpCall } from '../libs/models';
import routes from '../libs/routes';
import utils from '../libs/utils';

const getAnswerCall: HttpCall[] = [
  {
    description: 'Call GET answer',
    path: '/answer',
    method: 'GET',
    testedResponse: {
      body: '42',
      status: 200
    }
  },
  {
    description: 'Call GET answer',
    path: '/answer',
    method: 'GET',
    testedResponse: {
      body: { contains: 'Cannot GET /answer' },
      status: 404
    }
  }
];

describe('Enable/disable routes', () => {
  it('should open and start the environment', async () => {
    await environments.open('basic-data');
    await environments.start();
  });

  it('should call untouched route', async () => {
    await routes.select(2);
    await $(
      '.routes-menu .menu-list .nav-item .nav-link.active.route-disabled'
    ).waitForExist({ reverse: true });
    await http.assertCallWithPort(getAnswerCall[0], 3000);
  });

  it('should disable route /answer and verify the settings', async () => {
    await routes.toggleDisable(2);
    await $(
      '.routes-menu .menu-list .nav-item .nav-link.active.route-disabled'
    ).waitForExist();
    await utils.waitForAutosave();
    await file.verifyObjectPropertyInFile(
      './tmp/storage/settings.json',
      ['disabledRoutes.323a25c6-b196-4d27-baf8-8aeb83d87c76.0'],
      ['9745a08e-94c2-451e-bccc-b31dc608bb6d']
    );
  });

  it('should call disabled route', async () => {
    await environments.restart();
    await http.assertCallWithPort(getAnswerCall[1], 3000);
  });

  it('should re-enable route and verify the settings', async () => {
    await routes.toggleDisable(2);
    await $(
      '.routes-menu .menu-list .nav-item .nav-link.active.route-disabled'
    ).waitForExist({ reverse: true });
    await utils.waitForAutosave();
    await file.verifyObjectPropertyInFile(
      './tmp/storage/settings.json',
      ['disabledRoutes.323a25c6-b196-4d27-baf8-8aeb83d87c76.0'],
      [undefined]
    );
  });

  it('should call reenabled route', async () => {
    await environments.restart();
    await http.assertCallWithPort(getAnswerCall[0], 3000);
  });
});
