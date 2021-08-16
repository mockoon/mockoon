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
});
