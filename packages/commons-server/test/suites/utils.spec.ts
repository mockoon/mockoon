import { strictEqual } from 'assert';
import { Response } from 'express';
import fs from 'fs';
import { SafeString } from 'handlebars';
import {
  DecompressBody,
  fromSafeString,
  fullTextSearch,
  ToBase64
} from '../../src/libs/utils';

describe('Utils', () => {
  describe('toBase64', () => {
    it('should return string converted to base64 when btoa available', () => {
      global.btoa = () => Buffer.from('text').toString('base64');

      const base64 = ToBase64('text');

      strictEqual(base64, 'dGV4dA==');
    });

    it('should return string converted to base64 when only Buffer available', () => {
      const base64 = ToBase64('text');

      strictEqual(base64, 'dGV4dA==');
    });

    afterEach(() => {
      (global.btoa as unknown) = undefined;
    });
  });

  describe('DecompressBody', () => {
    it('should decompress gzip encoded data', () => {
      const response = {
        getHeader: (_: any) => 'gzip',
        body: fs.readFileSync('./test/data/gzip.data')
      };

      strictEqual(DecompressBody(response as Response), 'gzipTest');
    });

    it('should decompress brotli encoded data', () => {
      const response = {
        getHeader: (_: any) => 'br',
        body: fs.readFileSync('./test/data/br.data')
      };

      strictEqual(DecompressBody(response as Response), 'brTest');
    });

    it('should decompress deflate encoded data', () => {
      const response = {
        getHeader: (_: any) => 'deflate',
        body: fs.readFileSync('./test/data/deflate.data')
      };

      strictEqual(DecompressBody(response as Response), 'deflateTest');
    });

    it('should handle plain data', () => {
      const response = {
        getHeader: (_: any) => undefined,
        body: fs.readFileSync('./test/data/plain.data')
      };

      strictEqual(DecompressBody(response as Response), 'plainTest');
    });
  });

  describe('fromSafeString', () => {
    it('should return a string if input is a string', () => {
      const newString = fromSafeString('text');

      strictEqual(newString, 'text');
    });

    it('should return a string if input is a SafeString', () => {
      const newString = fromSafeString(new SafeString('text'));

      strictEqual(newString, 'text');
    });
  });

  describe('fullTextSearch', () => {
    it('should return true if query matches a property value in the object', () => {
      const object = { name: 'John', age: 30 };
      const query = 'John';

      strictEqual(fullTextSearch(object, query), true);
    });

    it('should return false if query does not match any property value in the object', () => {
      const object = { name: 'John', age: 30 };
      const query = 'Mike';

      strictEqual(fullTextSearch(object, query), false);
    });

    it('should return true if query matches a property value in the nested object', () => {
      const object = { name: 'John', age: 30, address: { city: 'New York' } };
      const query = 'New York';

      strictEqual(fullTextSearch(object, query), true);
    });

    it('should return false if query does not match any property value in the nested object', () => {
      const object = { name: 'John', age: 30, address: { city: 'New York' } };
      const query = 'Los Angeles';

      strictEqual(fullTextSearch(object, query), false);
    });

    it('should return true if query matches a value in the array', () => {
      const object = {
        name: 'John',
        age: 30,
        hobbies: ['reading', 'swimming']
      };
      const query = 'swimming';

      strictEqual(fullTextSearch(object, query), true);
    });

    it('should return false if query does not match any value in the array', () => {
      const object = {
        name: 'John',
        age: 30,
        hobbies: ['reading', 'swimming']
      };
      const query = 'dancing';

      strictEqual(fullTextSearch(object, query), false);
    });

    it('should be case insensitive', () => {
      const object = { name: 'John', age: 30 };
      const query = 'john';

      strictEqual(fullTextSearch(object, query), true);
    });

    it('should find a number', () => {
      const object = { name: 'John', age: 30 };
      const query = '30';

      strictEqual(fullTextSearch(object, query), true);
    });

    it('should return true for partial match', () => {
      const object = { name: 'John', age: 30 };
      const query = 'Jo';

      strictEqual(fullTextSearch(object, query), true);
    });

    it('should return true for partial match with numbers', () => {
      const object = { name: 'John', age: 30 };
      const query = '3';

      strictEqual(fullTextSearch(object, query), true);
    });

    it('should return true when object is an array', () => {
      const object = ['John', 'Doe', 30];
      const query = 'Doe';

      strictEqual(fullTextSearch(object, query), true);
    });

    it('should return true when object is a simple string', () => {
      const object = 'John';
      const query = 'John';

      strictEqual(fullTextSearch(object, query), true);
    });

    it('should return true when object is a simple number', () => {
      const object = 30;
      const query = '30';

      strictEqual(fullTextSearch(object, query), true);
    });

    it('should return false when object is true and query is "true"', () => {
      const object = true;
      const query = 'true';

      strictEqual(fullTextSearch(object, query), false);
    });

    it('should return false when object is false and query is "false"', () => {
      const object = false;
      const query = 'false';

      strictEqual(fullTextSearch(object, query), false);
    });

    it('should return false when object is null and query is "null"', () => {
      const object = null;
      const query = 'null';

      strictEqual(fullTextSearch(object, query), false);
    });

    it('should return true when query is an empty string', () => {
      const object = { name: 'John', age: 30 };
      const query = '';

      strictEqual(fullTextSearch(object, query), true);
    });

    it('should return false when object is an empty object', () => {
      const object = {};
      const query = 'John';

      strictEqual(fullTextSearch(object, query), false);
    });

    it('should return false when object is an empty array', () => {
      const object = [];
      const query = 'John';

      strictEqual(fullTextSearch(object, query), false);
    });
  });
});
