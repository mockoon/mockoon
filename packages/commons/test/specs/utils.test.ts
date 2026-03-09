import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { express5PathConvert } from '../../src';

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
