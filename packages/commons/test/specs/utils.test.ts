import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import {
  express5PathConvert,
  generateSecureToken,
  parseByteSize
} from '../../src';

describe('generateSecureToken', () => {
  it('should generate a 64-char hex token by default', () => {
    const token = generateSecureToken();

    strictEqual(token.length, 64);
    strictEqual(/^[0-9a-f]+$/.test(token), true);
  });

  it('should generate a token with 2 hex chars per byte', () => {
    const token = generateSecureToken(16);

    strictEqual(token.length, 32);
    strictEqual(/^[0-9a-f]+$/.test(token), true);
  });

  it('should floor non-integer byte lengths', () => {
    const token = generateSecureToken(5.9);

    strictEqual(token.length, 10);
  });

  it('should enforce a minimum of one byte', () => {
    strictEqual(generateSecureToken(0).length, 2);
    strictEqual(generateSecureToken(-42).length, 2);
  });
});

describe('parseByteSize', () => {
  it('should default empty values to zero', () => {
    strictEqual(parseByteSize(), 0);
    strictEqual(parseByteSize(''), 0);
    strictEqual(parseByteSize('   '), 0);
  });

  it('should accept raw byte counts as numbers', () => {
    strictEqual(parseByteSize(104857600), 104857600);
  });

  it('should accept raw byte counts as strings', () => {
    strictEqual(parseByteSize('104857600'), 104857600);
  });

  it('should accept human-readable megabytes', () => {
    strictEqual(parseByteSize('100MB'), 100 * 1024 * 1024);
    strictEqual(parseByteSize('100 mb'), 100 * 1024 * 1024);
  });

  it('should accept other binary units', () => {
    strictEqual(parseByteSize('1.5kb'), 1536);
    strictEqual(parseByteSize('2GB'), 2 * 1024 * 1024 * 1024);
  });

  it('should reject invalid values', () => {
    try {
      parseByteSize('ten megabytes');
      strictEqual(false, true);
    } catch (error) {
      strictEqual(error instanceof Error, true);
    }
  });

  it('should reject non-finite numeric values', () => {
    try {
      parseByteSize(Number.NaN);
      strictEqual(false, true);
    } catch (error) {
      strictEqual(error instanceof Error, true);
    }

    try {
      parseByteSize(Number.POSITIVE_INFINITY);
      strictEqual(false, true);
    } catch (error) {
      strictEqual(error instanceof Error, true);
    }
  });

  it('should reject negative numeric values', () => {
    try {
      parseByteSize(-1);
      strictEqual(false, true);
    } catch (error) {
      strictEqual(error instanceof Error, true);
    }
  });

  it('should reject parsed non-finite values from oversized numbers', () => {
    try {
      parseByteSize('9'.repeat(500));
      strictEqual(false, true);
    } catch (error) {
      strictEqual(error instanceof Error, true);
    }
  });
});

describe('express5PathConvert', () => {
  it('should name unnamed wildcards', () => {
    strictEqual(express5PathConvert('/test/*'), '/test/*wildcard0');
  });

  it('should name each unnamed wildcard', () => {
    strictEqual(
      express5PathConvert('/test/*/nested/*'),
      '/test/*wildcard0/nested/*wildcard1'
    );
  });

  it('should convert optional params using braces', () => {
    strictEqual(express5PathConvert('/users/:id?'), '/users{/:id}');
  });

  it('should convert optional extension params using braces', () => {
    strictEqual(express5PathConvert('/file/:name.:ext?'), '/file/:name{.:ext}');
  });

  it('should convert one-or-more params to wildcard params', () => {
    strictEqual(express5PathConvert('/files/:path+'), '/files/*path');
  });

  it('should convert zero-or-more params to optional wildcard params', () => {
    strictEqual(express5PathConvert('/files/:path*'), '/files{/*path}');
  });

  it('should keep already named wildcards unchanged', () => {
    strictEqual(express5PathConvert('/test/*rest'), '/test/*rest');
  });

  it('should convert optional literal characters using braces', () => {
    strictEqual(express5PathConvert('/ab?cd'), '/a{b}cd');
  });

  it('should convert one-or-more literal characters to optional', () => {
    strictEqual(express5PathConvert('/ab+cd'), '/ab{b}cd');
  });

  it('should convert parentheses groups with optional to braces', () => {
    strictEqual(express5PathConvert('/ab(cd)?e'), '/ab{cd}e');
  });

  it('should convert parentheses groups without optional to braces', () => {
    strictEqual(express5PathConvert('/ab(cd)e'), '/ab{cd}e');
  });

  it('should handle complex mixed patterns', () => {
    strictEqual(
      express5PathConvert('/path/*/file.:ext?/:id+'),
      '/path/*wildcard0/file{.:ext}/*id'
    );
  });

  // Escaped characters - should not be converted
  it('should preserve escaped parentheses', () => {
    strictEqual(
      express5PathConvert('/path/\\(literal\\)'),
      '/path/\\(literal\\)'
    );
  });

  it('should preserve escaped opening parenthesis', () => {
    strictEqual(express5PathConvert('/path/\\(test'), '/path/\\(test');
  });

  it('should preserve escaped closing parenthesis', () => {
    strictEqual(express5PathConvert('/path/test\\)'), '/path/test\\)');
  });

  it('should convert non-escaped parentheses while preserving escaped ones', () => {
    strictEqual(
      express5PathConvert('/path/(group)\\(literal\\)'),
      '/path/{group}\\(literal\\)'
    );
  });

  it('should preserve escaped optional character', () => {
    strictEqual(express5PathConvert('/path/file\\?'), '/path/file\\?');
  });

  it('should preserve escaped plus character', () => {
    strictEqual(express5PathConvert('/path/file\\+'), '/path/file\\+');
  });

  it('should convert unescaped optional while preserving escaped in same path', () => {
    strictEqual(express5PathConvert('/a?b/c\\?d'), '/{a}b/c\\?d');
  });

  it('should handle escaped characters mixed with real patterns', () => {
    strictEqual(
      express5PathConvert('/api\\?v1/:id?/file.:ext?'),
      '/api\\?v1{/:id}/file{.:ext}'
    );
  });

  it('should handle multiple escaped sequences', () => {
    strictEqual(
      express5PathConvert('/\\(group1\\)/:id/\\(group2\\)'),
      '/\\(group1\\)/:id/\\(group2\\)'
    );
  });

  it('should convert optional in parentheses while preserving escaped parens', () => {
    strictEqual(
      express5PathConvert('/prefix(suffix)?/\\(literal\\)'),
      '/prefix{suffix}/\\(literal\\)'
    );
  });

  it('should handle nested patterns with wildcards', () => {
    strictEqual(
      express5PathConvert('/api/*/resources/:id'),
      '/api/*wildcard0/resources/:id'
    );
  });

  it('should handle multiple optional extensions', () => {
    strictEqual(
      express5PathConvert('/file/:name.:ext1?.:ext2?'),
      '/file/:name{.:ext1}{.:ext2}'
    );
  });

  it('should handle wildcards with parameters', () => {
    strictEqual(
      express5PathConvert('/*/uploads/:id'),
      '/*wildcard0/uploads/:id'
    );
  });

  it('should not convert escaped wildcard prefix', () => {
    strictEqual(
      express5PathConvert('/path/\\*notawildcard'),
      '/path/\\*notawildcard'
    );
  });

  it('should convert wildcard after slash while preserving escaped', () => {
    strictEqual(
      express5PathConvert('/path/*/\\*literal'),
      '/path/*wildcard0/\\*literal'
    );
  });

  it('should handle complex real-world pattern', () => {
    strictEqual(
      express5PathConvert('/api/v:version?/users/:userId/files/:fileId?'),
      '/api/v:versio{n}/users/:userId/files{/:fileId}'
    );
  });

  it('should handle pattern with all special characters', () => {
    strictEqual(
      express5PathConvert('/api(v2)?/users/:id+/file.:ext?/*'),
      '/api{v2}/users/*id/file{.:ext}/*wildcard0'
    );
  });
});
