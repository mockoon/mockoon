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
});
