import { expect } from 'chai';
import { Response } from 'express';
import fs from 'fs';
import { SafeString } from 'handlebars';
import { DecompressBody, fromSafeString, ToBase64 } from '../../src/libs/utils';

describe('Utils', () => {
  describe('toBase64', () => {
    it('should return string converted to base64 when btoa available', () => {
      global.btoa = () => Buffer.from('text').toString('base64');

      const base64 = ToBase64('text');

      expect(base64).to.equal('dGV4dA==');
    });

    it('should return string converted to base64 when only Buffer available', () => {
      const base64 = ToBase64('text');

      expect(base64).to.equal('dGV4dA==');
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

      expect(DecompressBody(response as Response)).to.equal('gzipTest');
    });

    it('should decompress brotli encoded data', () => {
      const response = {
        getHeader: (_: any) => 'br',
        body: fs.readFileSync('./test/data/br.data')
      };

      expect(DecompressBody(response as Response)).to.equal('brTest');
    });

    it('should decompress deflate encoded data', () => {
      const response = {
        getHeader: (_: any) => 'deflate',
        body: fs.readFileSync('./test/data/deflate.data')
      };

      expect(DecompressBody(response as Response)).to.equal('deflateTest');
    });

    it('should handle plain data', () => {
      const response = {
        getHeader: (_: any) => undefined,
        body: fs.readFileSync('./test/data/plain.data')
      };

      expect(DecompressBody(response as Response)).to.equal('plainTest');
    });
  });

  describe('fromSafeString', () => {
    it('should return a string if input is a string', () => {
      const newString = fromSafeString('text');

      expect(newString).to.equal('text');
    });

    it('should return a string if input is a SafeString', () => {
      const newString = fromSafeString(new SafeString('text'));

      expect(newString).to.equal('text');
    });
  });
});
