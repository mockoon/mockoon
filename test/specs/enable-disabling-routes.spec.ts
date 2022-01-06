import environments from '../libs/environments';
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

  it('Call untouched route', async () => {
    await routes.select(2);
    await $(
      '.routes-menu .menu-list .nav-item .nav-link.active.route-disabled'
    ).waitForExist({ reverse: true });
    await http.assertCallWithPort(getAnswerCall[0], 3000);
  });

  it('Disabling route /answer', async () => {
    await routes.toggleDisable(2);
    await $(
      '.routes-menu .menu-list .nav-item .nav-link.active.route-disabled'
    ).waitForExist();
    await environments.restart();
  });

  it('Call disabled route', async () => {
    await utils.waitForAutosave();
    await http.assertCallWithPort(getAnswerCall[1], 3000);
  });

  it('Re-enable route', async () => {
    await routes.toggleDisable(2);
    await $(
      '.routes-menu .menu-list .nav-item .nav-link.active.route-disabled'
    ).waitForExist({ reverse: true });
    await environments.restart();
  });

  it('Call reenabled route', async () => {
    await utils.waitForAutosave();
    await http.assertCallWithPort(getAnswerCall[0], 3000);
  });
});
