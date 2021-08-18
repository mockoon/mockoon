import { promises as fs } from 'fs';
import { resolve } from 'path';
import { Tests } from 'test/lib/tests';

describe('File serving', () => {
  const filepathSelector = 'input[formControlName="filePath"]';

  describe('File not found', () => {
    const tests = new Tests('basic-data');

    it('should return an error and keep the defined status', async () => {
      await tests.helpers.selectRoute(2);
      await tests.helpers.setElementValue(
        filepathSelector,
        './non-existing-file.txt'
      );
      await tests.helpers.startEnvironment();
      await tests.helpers.httpCallAsserter({
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
      await tests.helpers.switchTab('SETTINGS');
      await tests.helpers.elementClick("label[for='fallbackTo404']");
      await tests.helpers.waitForAutosave();
      await tests.helpers.httpCallAsserter({
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
    const tests = new Tests('basic-data');

    it('should give access to the file referred to, through an absolute path', async () => {
      await fs.copyFile('./test/data/test.txt', './tmp/storage/test.txt');
      await tests.helpers.selectRoute(2);
      await tests.helpers.setElementValue(
        filepathSelector,
        resolve('./tmp/storage/', 'test.txt')
      );
      await tests.helpers.startEnvironment();
      await tests.helpers.httpCallAsserter({
        path: '/answer',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'dolphin'
        }
      });
    });

    it('should return an error when not finding the right file', async () => {
      await tests.helpers.setElementValue(
        filepathSelector,
        resolve('./tmp/storage/', 'notTheProperTest.txt')
      );
      await tests.helpers.waitForAutosave();
      await tests.helpers.httpCallAsserter({
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
    const tests = new Tests('basic-data');

    it('should give access to the file referred to, through a relative path', async () => {
      await fs.copyFile('./test/data/test.txt', './tmp/storage/test.txt');
      await tests.helpers.startEnvironment();
      await tests.helpers.selectRoute(2);
      await tests.helpers.setElementValue(filepathSelector, './test.txt');
      await tests.helpers.waitForAutosave();
      await tests.helpers.httpCallAsserter({
        path: '/answer',
        method: 'GET',
        testedResponse: {
          status: 200,
          body: 'dolphin'
        }
      });
    });

    it('should return an error when not finding the right file', async () => {
      await tests.helpers.setElementValue(
        filepathSelector,
        './tmp/storage/notTheProperTest.txt'
      );
      await tests.helpers.waitForAutosave();
      await tests.helpers.httpCallAsserter({
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
