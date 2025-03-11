import { BodyTypes } from '@mockoon/commons';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import environments from '../libs/environments';
import http from '../libs/http';
import routes from '../libs/routes';
import utils from '../libs/utils';

describe('File serving', () => {
  it('should open the environment', async () => {
    await environments.open('basic-data');
  });

  describe('Path escape', () => {
    it('should allow escaping when there is no templating', async () => {
      await environments.start();
      await routes.select(2);
      await routes.selectBodyType(BodyTypes.FILE);
      await routes.setFile('../window-state.json');

      await utils.waitForAutosave();

      await http.assertCall({
        // this file always exists in the data folder
        path: '/answer',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: {
            contains: 'isFullScreen'
          }
        }
      });
    });

    it('should return an error when trying to escape a relative path', async () => {
      await routes.select(2);
      await routes.selectBodyType(BodyTypes.FILE);
      await routes.setFile("./{{queryParam 'filename'}}");

      await utils.waitForAutosave();

      await http.assertCall({
        // this file always exists in the data folder
        path: '/answer?filename=../window-state.json',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: {
            contains:
              'Error while serving the content: Access to relative path outside of the environment base directory'
          }
        }
      });
    });

    it('should return an error when trying to escape an absolute path', async () => {
      await routes.select(2);
      await routes.selectBodyType(BodyTypes.FILE);
      await routes.setFile(
        `${process.cwd()}/tmp/storage/{{queryParam 'filename'}}`
      );
      await utils.waitForAutosave();

      await http.assertCall({
        // this file always exists in the data folder
        path: '/answer?filename=../window-state.json',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: {
            contains:
              'Error while serving the content: Access to absolute path outside of the original static base directory'
          }
        }
      });
    });
  });

  describe('File not found', () => {
    it('should return an error and keep the defined status', async () => {
      await routes.select(2);
      await routes.selectBodyType(BodyTypes.FILE);
      await routes.setFile('./non-existing-file.txt');
      await utils.waitForAutosave();

      await http.assertCall({
        path: '/answer',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: {
            contains: 'Error while serving the file content:'
          }
        }
      });
    });

    it('should return the body content and a 404 if option enabled', async () => {
      await routes.switchTab('SETTINGS');
      await $("label[for='route-settings-fallback-to-404']").click();
      await utils.waitForAutosave();
      await http.assertCall({
        path: '/answer',
        method: 'GET',
        testedResponse: {
          status: 404,
          body: '42'
        }
      });
    });
  });

  describe('Absolute filepath', () => {
    it('should give access to the file referred to, through an absolute path', async () => {
      await fs.copyFile('./test/data/res/test.txt', './tmp/storage/test.txt');
      await routes.switchTab('SETTINGS');
      await $("label[for='route-settings-fallback-to-404']").click();
      await routes.select(2);
      await routes.switchTab('RESPONSE');
      await routes.setFile(resolve('./tmp/storage/', 'test.txt'));
      await utils.waitForAutosave();
      await http.assertCall({
        path: '/answer',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'dolphin'
        }
      });
    });

    it('should return an error when not finding the right file', async () => {
      await routes.setFile(resolve('./tmp/storage/', 'notTheProperTest.txt'));
      await utils.waitForAutosave();
      await http.assertCall({
        path: '/answer',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: {
            contains: 'Error while serving the file content:'
          }
        }
      });
    });
  });

  describe('Relative filepath', () => {
    it('should give access to the file referred to, through a relative path', async () => {
      await fs.copyFile('./test/data/res/test.txt', './tmp/storage/test.txt');

      await routes.select(2);
      await routes.switchTab('RESPONSE');
      await routes.setFile('./test.txt');
      await utils.waitForAutosave();
      await http.assertCall({
        path: '/answer',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'dolphin'
        }
      });
    });

    it('should return an error when not finding the right file', async () => {
      await routes.setFile('./tmp/storage/notTheProperTest.txt');
      await utils.waitForAutosave();
      await http.assertCall({
        path: '/answer',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: {
            contains: 'Error while serving the file content:'
          }
        }
      });
    });
  });
});
