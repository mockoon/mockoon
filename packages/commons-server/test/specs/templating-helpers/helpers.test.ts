import { format as dateFormat } from 'date-fns';
import { match, ok, strictEqual } from 'node:assert';
import { before, describe, it } from 'node:test';
import { SetFakerSeed } from '../../../src';
import { TemplateParser } from '../../../src/libs/template-parser';

describe('Template parser', () => {
  before(() => {
    SetFakerSeed(1);
  });

  describe('Helper: switch', () => {
    it('should return different values depending on the string value', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{#switch (body "prop1")}}{{#case "value1"}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: { prop1: 'value1' }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'value1');
    });

    it('should return default values depending on the string value', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{#switch (body "prop1")}}{{#case "value1"}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: 'defaultvalue' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'defaultvalue');
    });

    it('should return different values depending on the index', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{#repeat 2 comma=false}}{{@index}}{{#switch @index}}{{#case 0}}John{{/case}}{{#default}}Peter{{/default}}{{/switch}}{{/repeat}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0John1Peter');
    });

    it('should return different values depending on the boolean value', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{#switch (bodyRaw "prop1")}}{{#case true}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: true } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'value1');
    });

    it('should return different values depending on the boolean value', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{#switch (bodyRaw "prop1")}}{{#case true}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: false } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'defaultvalue');
    });
  });

  describe('Helper: concat', () => {
    it('should concat two strings', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{concat 'test' 'test'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'testtest');
    });

    it('should concat two strings and repeat index', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{#repeat 1 comma=false}}{{concat 'test' @index 'test'}}{{/repeat}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'test0test');
    });

    it('should concat two strings and the result of a helper', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{#repeat 1 comma=false}}{{concat 'test' (body 'id') 'test'}}{{/repeat}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { id: '123' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'test123test');
    });

    it('should concat two strings and number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{concat 'test' 123 'test'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'test123test');
    });

    it('should concat object path to retrieve body array items', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{#repeat 2 comma=false}}item_{{body (concat 'a.' @index '.item')}}{{/repeat}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { a: [{ item: 10 }, { item: 20 }] } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'item_10item_20');
    });

    it('should concat arrays', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{{stringify (concat (array 'item1' 'item2') (array 'item3' 'item4') (array 'item5'))}}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        '[\n  "item1",\n  "item2",\n  "item3",\n  "item4",\n  "item5"\n]'
      );
    });
  });

  describe('Helper: setVar', () => {
    it('should set a variable to a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{setVar 'testvar' 'testvalue'}}{{@testvar}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'testvalue');
    });

    it('should set a variable to a number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{setVar 'testvar' 123}}{{@testvar}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '123');
    });

    it('should set a variable value to body helper result', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{setVar 'testvar' (body 'uuid')}}{{@testvar}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: { uuid: '0d35618e-5e85-4c09-864d-6d63973271c8' }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0d35618e-5e85-4c09-864d-6d63973271c8');
    });

    it('should set a variable value to oneOf helper result', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{setVar 'testvar' (oneOf (array 'item1'))}}{{@testvar}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'item1');
    });

    it('should set a variable and use it in another helper', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{setVar 'testvar' 5}}{{#repeat @testvar comma=false}}test{{/repeat}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'testtesttesttesttest');
    });

    it('should set a variable in a different scope: repeat', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{#repeat 5 comma=false}}{{setVar 'testvar' @index}}{{@testvar}}{{/repeat}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '01234');
    });

    it('should set a variable in root scope and child scope: repeat', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{setVar 'outsidevar' 'test'}}{{@outsidevar}}{{#repeat 5 comma=false}}{{setVar 'testvar' @index}}{{@testvar}}{{@outsidevar}}{{/repeat}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'test0test1test2test3test4test');
    });

    it('should set variables in two nested repeat', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{#repeat 1 comma=false}}{{setVar 'itemId' 25}}Item:{{@itemId}}{{setVar 'nb' 1}}{{#repeat @nb comma=false}}{{setVar 'childId' 56}}Child:{{@childId}}parent:{{@itemId}}{{/repeat}}{{/repeat}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'Item:25Child:56parent:25');
    });

    it('should set variables in a each', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{#each (split '1 2')}}{{setVar 'item' this}}{{@item}}{{/each}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '12');
    });

    it('should set variables in a each in a repeat', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{#repeat 2 comma=false}}{{setVar 'repeatvar' 'repeatvarvalue'}}{{#each (split '1 2')}}{{setVar 'item' this}}{{@repeatvar}}{{@item}}{{/each}}{{/repeat}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        'repeatvarvalue1repeatvarvalue2repeatvarvalue1repeatvarvalue2'
      );
    });

    it('should set variables in two each', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{#each (split '1 2')}}{{setVar 'each1var' 'each1varvalue'}}{{#each (split '1 2')}}{{setVar 'each2var' this}}{{@each1var}}{{@each2var}}{{/each}}{{/each}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        'each1varvalue1each1varvalue2each1varvalue1each1varvalue2'
      );
    });

    it('should set a variable to empty value if none provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{setVar 'testvar'}}{{@testvar}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should not set a variable if no name provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{setVar ''}}{{@testvar}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });
  });

  describe('Helper: getVar', () => {
    it('should return empty if no var name provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{setVar 'testvar' 'testvalue'}}{{getVar}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should get a variable from simple var name', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{setVar 'testvar' 'testvalue'}}{{getVar 'testvar'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'testvalue');
    });

    it('should get a variable from dynamically built var name', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{setVar 'testvar' 'testvalue'}}{{getVar (concat 'test' 'var')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'testvalue');
    });

    it('should get a variable from dynamically built var name', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{setVar 'testvar' 'testvalue'}}{{getVar (bodyRaw 'prop1')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: 'testvar' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'testvalue');
    });
  });

  describe('Helper: date', () => {
    it('should return an empty string if given the wrong amount of arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{date}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return an empty string if given the wrong amount of arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{date '2022-01-01'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '');
    });

    it('should return a date using a the default format', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{date '2022-01-01' '2022-02-01' 'YYYY'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '2022');
    });

    it('should return a date using a given format', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{date '2022-02-01' '2022-02-01' 'yyyy-MM-dd'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '2022-02-01');
    });

    it('should return a date when using queryParams', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{date (queryParam 'dateFrom') (queryParam 'dateTo') 'YYYY'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          query: {
            dateFrom: '2022-06-01T00:00:00.000Z',
            dateTo: '2022-06-03T12:00:00.000Z'
          }
        } as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '2022');
    });
  });

  describe('Helper: dateFormat', () => {
    it('should return an empty string if given the wrong amount of arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{dateFormat}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return an empty string if given the wrong amount of arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{dateFormat '2022-01-01'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '');
    });

    it('should return a date using a given format', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{dateFormat '2022-02-01' 'YYYY'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '2022');
    });

    it('should return a date using a given format, when a Date object is passed as a param', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{dateFormat (faker 'date.recent' (object refDate='2022-01-10T00:00:00.000Z' days=1)) 'YYYY'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '2022');
    });
  });

  describe('Helper: isValidDate', () => {
    it('should return false if given the wrong amount of arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{isValidDate}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });

    it('should return true if a valid date string is provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{isValidDate '2022-01-01'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'true');
    });

    it('should return false if an invalid date string is provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{isValidDate '2022-01-50'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'false');
    });

    it('should return true if a valid date number (ms) is provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{isValidDate 1727272454000}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'true');
    });

    it('should return true if a valid date is provided through another helper (SafeString)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{isValidDate (queryParam "date")}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { date: '2024-02-10' } } as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'true');
    });
  });

  describe('Helper: dateTimeShift', () => {
    it('should not throw an error when passed with invalid parameters.', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{dateTimeShift 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      // When invalid parameters are passed, the default should just be to return the current date with no shift.
      const date = new Date();
      const dateString = dateFormat(date, "yyyy-MM-dd'T'HH:mm");
      match(parseResult, new RegExp(dateString + '.*'));
    });

    it('should return a date shifted the specified amount of days from now.', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{dateTimeShift days=2}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      const date = new Date();
      date.setDate(date.getDate() + 2);
      // As our reference date here may differ slightly from the one interally used in the helper, it's more reliable to just compare the date/time with the seconds (and lower) excluded.
      const dateString = dateFormat(date, "yyyy-MM-dd'T'HH:mm");
      match(parseResult, new RegExp(dateString + '.*'));
    });

    it('should return a date shifted by the requested amount from a specified start date.', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{dateTimeShift date='2021-02-01' days=2 months=4}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      match(parseResult, /2021-06-03.*/);
    });

    it('should return a date shifted by the requested amount from the specified start date in the specified format.', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{dateTimeShift date='2021-02-01' format='yyyy-MM-dd' days=2 months=4}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '2021-06-03');
    });

    it('should return a date time shifted by the requested amount from the specified start date in the specified format.', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{dateTimeShift date='2021-02-01T10:45:00' format=\"yyyy-MM-dd'T'HH:mm:ss\" days=8 months=3 hours=1 minutes=2 seconds=3}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '2021-05-09T11:47:03');
    });

    it('should return a date time shifted by the requested amount when another helper is used as the date source (safestring).', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{dateTimeShift date=(queryParam 'date') format=\"yyyy-MM-dd'T'HH:mm:ss\" hours=1}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { date: '2021-01-01 05:00:00' } } as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '2021-01-01T06:00:00');
    });

    it('should return a date time shifted by the requested amount when another helper is used as the date and months and days source (safestring).', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{dateTimeShift date=(queryParam 'date') format=\"yyyy-MM-dd\" days=(queryParam 'days') months=(queryParam 'months')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { date: '2021-01-01', months: 1, days: 1 } } as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '2021-02-02');
    });
  });

  describe('Helper: includes', () => {
    it('should return true if a string includes a search string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{includes 'testdata' 'test'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'true');
    });

    it('should return false if a string does not include a search string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{includes 'testdata' 'not'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'false');
    });

    it('should not fail when passing no parameters', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{includes}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'true');
    });

    it('should not fail when passing only one parameter', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{includes 'testdata'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'true');
    });
  });

  describe('Helper: substr', () => {
    it('should return a substring of the provided string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{substr 'testdata' 4 4}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'data');
    });

    it('should work correctly when from and length parameters are passed as strings', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{substr 'testdata' '4' '4'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'data');
    });

    it('should return a substring of the provided string to the end when the length parameter is excluded (from as a number)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{substr 'testdata' 4}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'data');
    });

    it('should return a substring of the provided string to the end when the length parameter is excluded (from as a string)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{substr 'testdata' '4'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'data');
    });

    it('should work correctly when variables are passed as parameters as numbers', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{setVar 'testvar' 'testdata'}}{{setVar 'from' 4}}{{setVar 'length' 4}}{{substr @testvar @from @length}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'data');
    });

    it('should work correctly when variables are passed as parameters as strings', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{setVar 'testvar' 'testdata'}}{{setVar 'from' '4'}}{{setVar 'length' '4'}}{{substr @testvar @from @length}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'data');
    });

    it('should work correctly when other helpers are used for parameters as numbers', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{substr (body 'prop1') (body 'prop2') (body 'prop3')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: 'testdata', prop2: 4, prop3: 4 } } as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'data');
    });

    it('should work correctly when other helpers are used for parameters as strings', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{substr (body 'prop1') (body 'prop2') (body 'prop3')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: 'testdata', prop2: '4', prop3: '4' } } as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'data');
    });

    it('should not fail when passing no parameters', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{substr}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '');
    });

    it('should not fail when passing only one parameter', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{substr 'testdata'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'testdata');
    });
  });

  describe('Helper: split', () => {
    it('should split a string using spaces as separator', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{split "I love dolphins" " "}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'I,love,dolphins');
    });

    it('should split a string using commas', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{split "I too, love dolphins" ","}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'I too, love dolphins');
    });

    it('should split a string using spaces by default', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{split "I love dolphins"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'I,love,dolphins');
    });

    it('should split a string using spaces when given anything else but a string as separator', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{split "I love dolphins" 123}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'I,love,dolphins');
    });

    it('should return an empty string when given anything else but a string as data', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{split 123 ","}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '');
    });

    it('should be usable within a #each', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{#each (split "1 2 3" " ")}}dolphin,{{/each}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'dolphin,dolphin,dolphin,');
    });

    it('should be compatible with SafeString (queryParam)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{#each (split (queryParam 'param1') ',')}}item{{this}},{{/each}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { param1: '123,456,789' } } as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'item123,item456,item789,');
    });
  });

  describe('Helper: lowercase', () => {
    it('should return nothing when no parameter is passed', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{lowercase}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '');
    });

    it('should lowercase a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{lowercase "ABCD"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'abcd');
    });

    it('should be usable within a #switch', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{#switch (lowercase "ABCD")}}{{#case "abcd"}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'value1');
    });

    it('should be compatible with SafeString (queryParam)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{lowercase (queryParam 'param1')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { param1: 'ABCD' } } as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'abcd');
    });
  });

  describe('Helper: uppercase', () => {
    it('should return nothing when no parameter is passed', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{uppercase}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '');
    });

    it('should uppercase a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{uppercase "abcd"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'ABCD');
    });

    it('should be usable within a #switch', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{#switch (uppercase "abcd")}}{{#case "ABCD"}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'value1');
    });

    it('should be compatible with SafeString (queryParam)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{uppercase (queryParam 'param1')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { param1: 'abcd' } } as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'ABCD');
    });
  });

  describe('Helper: parseInt', () => {
    it('should return nothing when no parameter is passed', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{parseInt}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '');
    });

    it('should parse string and return an int', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{parseInt 'zero'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '');
    });

    it('should parse string and return an int', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{parseInt '10'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '10');
    });
  });

  describe('Helper: join', () => {
    it('should join an Array with spaces', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{join (array "Mockoon" "is" "nice") " "}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'Mockoon is nice');
    });

    it('should ignore non Array values and return same value', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{join "I too, love dolphins" " "}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'I too, love dolphins');
    });

    it('should use comma separator if no separator was provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{join (array "Water" "Tea" "Coffee")}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'Water, Tea, Coffee');
    });
  });

  describe('Helper: slice', () => {
    it('should return an empty string if parameter is not an array', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{slice "hello"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '');
    });

    it('should return the stringified array (same content)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{slice (array "Mockoon" "is" "very" "nice")}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'Mockoon,is,very,nice');
    });

    it('should return the stringified first two elements', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{slice (array "Mockoon" "is" "very" "nice") 0 2}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'Mockoon,is');
    });

    it('should return the stringified last two elements', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{slice (array "Mockoon" "is" "very" "nice") 2}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, 'very,nice');
    });
  });

  describe('Helper: indexOf', () => {
    it('should return the index of a matching substring', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{indexOf 'testdata' 'data'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '4');
    });

    it('should return the index of a matching substring from a given starting position', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{indexOf 'testdatadata' 'data' 6}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '8');
    });

    it('should still work correctly if the position parameter is passed as a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{indexOf 'testdatadata' 'data' '6'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '8');
    });

    it('should be possible to search for a number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{indexOf 'testdata12345' 3}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '10');
    });

    it('should be possible to search for a number (as a string)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{indexOf 'testdata12345' '3'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '10');
    });

    it('Can return the index from a previously set variable', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{setVar 'testvar' 'this is a test'}}{{indexOf @testvar 'test'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '10');
    });

    it('Can return the index from a previously set variable using a variable for the search string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{setVar 'testvar' 'this is a test'}}{{setVar 'searchstring' 'test'}}{{indexOf @testvar @searchstring}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '10');
    });

    it('Can return the index from a body property', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{indexOf (body 'prop1') (body 'prop2')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: { prop1: 'First test then test', prop2: 'test' }
        } as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '6');
    });

    it('Can return the index from a body property with a position', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{indexOf (body 'prop1') (body 'prop2') (body 'prop3')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            prop1: 'First test then test',
            prop2: 'test',
            prop3: 10
          }
        } as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '16');
    });

    it('should not fail when passing no parameters', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{indexOf}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '0');
    });

    it('should not fail when passing only one parameter', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{indexOf 'testdata'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      strictEqual(parseResult, '0');
    });
  });

  describe('Helper: someOf', () => {
    it('should return one element', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{someOf (array 'value1' 'value2' 'value3' 'value4' 'value5' 'value6') 1 1}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      const count = (parseResult.match(/value/g) ?? []).length;
      strictEqual(count, 1);
    });

    it('should return 1 to 3 elements', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{someOf (array 'value1' 'value2' 'value3' 'value4' 'value5' 'value6') 1 3}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });

      const countItems = (parseResult.match(/value/g) ?? []).length;
      ok(countItems >= 1 && countItems <= 3);

      const countSeparators = (parseResult.match(/,/g) ?? []).length;
      ok(countSeparators >= 0 && countSeparators <= 2);
    });

    it('should return 1 to 3 elements as array', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{someOf (array 'value1' 'value2' 'value3' 'value4' 'value5' 'value6') 1 3 true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(/^\[.*\]$/.exec(parseResult)?.length, 1);
      const countItems = (parseResult.match(/value/g) ?? []).length;
      ok(countItems >= 1 && countItems <= 3);

      const countSeparators = (parseResult.match(/,/g) ?? []).length;
      ok(countSeparators >= 0 && countSeparators <= 2);
    });

    it('should return 1 element stringified', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{someOf (array 'value1') 1 1 true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '[&quot;value1&quot;]');
    });

    it('should return 0 element stringified', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{someOf (array 'value1') 0 0 true}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '[]');
    });
  });

  describe('Helper: len', () => {
    it('should return the length of an array', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{len (array 1 2 3)}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '3');
    });

    it('should return the length of a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{len "Cowboy"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '6');
    });

    it('should return 0 if value is not an array', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{len true}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0');
    });

    it('should return 0 if no value was provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{len}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0');
    });
  });

  describe('Helper: base64', () => {
    it('should encode string to base64', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{base64 'abc'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'YWJj');
    });

    it('should encode body property to base64', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{base64 (body 'prop1')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: '123' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'MTIz');
    });

    it('should encode block to base64', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{#base64}}value: {{body 'prop1'}}{{/base64}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: '123' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'dmFsdWU6IDEyMw==');
    });
  });

  describe('Helper: base64', () => {
    it('should decode a string from base64', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{base64Decode 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkw'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'abcdefghijklmnopqrstuvwxyz1234567890');
    });

    it('should decode body property from base64', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{base64Decode (body 'prop1')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: { prop1: 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkw' }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'abcdefghijklmnopqrstuvwxyz1234567890');
    });

    it('should decode block from base64', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          "{{#base64Decode}}YWJjZGVmZ2hpamtsbW5vcHF{{body 'prop1'}}{{/base64Decode}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: 'yc3R1dnd4eXoxMjM0NTY3ODkw' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'abcdefghijklmnopqrstuvwxyz1234567890');
    });
  });

  describe('Helper: add', () => {
    it('should add a number to another', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{add 1 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '2');
    });

    it('should add the number described by a string to another number described by a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{add '1' '1'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '2');
    });

    it('should return the base value when given a single parameter', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{add 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{add }}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should add the body property to the initial value', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{add 1 (body 'prop1')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: '123' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '124');
    });

    it('should omit arguments that are NaN', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{add '1' '2' 'dolphins' '3'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '6');
    });
  });

  describe('Helper: subtract', () => {
    it('should subtract a number to another', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{subtract 1 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0');
    });

    it('should subtract the number described by a string to another number described by a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{subtract '1' '1'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0');
    });

    it('should return the base value when given a single parameter', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{subtract 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{subtract }}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should subtract the body property to the initial value', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{subtract 1 (body 'prop1')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: '123' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '-122');
    });

    it('should omit arguments that are NaN', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{subtract '6' '2' 'dolphins' '3'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });
  });

  describe('Helper: multiply', () => {
    it('should multiply a number by another', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{multiply 2 3}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '6');
    });

    it('should multiply the number described by a string by another number described by a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{multiply '2' '3'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '6');
    });

    it('should return the base value when given a single parameter', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{multiply 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{multiply }}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should multiply the body property by the initial value', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{multiply 2 (body 'prop1')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: '123' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '246');
    });

    it('should omit arguments that are NaN', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{multiply '1' '2' 'dolphins' '3'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '6');
    });
  });

  describe('Helper: divide', () => {
    it('should divide a number by another', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{divide 4 2}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '2');
    });

    it('should divide the number described by a string by another number described by a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{divide '6' '2'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '3');
    });

    it('should return the base value when given a single parameter', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{divide 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{divide }}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should divide the initial value by the body property', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{divide 246 (body 'prop1')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: '123' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '2');
    });

    it('should return an emtpy string when attempting to divide by 0', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{divide 5 '0' 5}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should omit arguments that are NaN', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{divide '6' '2' 'dolphins' '3'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });
  });

  describe('Helper: modulo', () => {
    it('should compute the modulo x of a number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{modulo 4 2}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0');
    });

    it('should compute the modulo x (passed as a string) of a number described by a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{modulo '4' '2'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0');
    });

    it('should return an empty string when given a single parameter', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{modulo 4}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{modulo }}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should compute the modulo of the initial value by the body property', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{modulo 4 (body 'prop1')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { prop1: '2' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0');
    });

    it('should return an empty string when attempting to compute modulo 0', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{modulo 4 0}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });
  });

  describe('Helper: ceil', () => {
    it('should ceil a number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{ceil 0.5}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should ceil a number described by a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{ceil '0.5'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should return the base value when given an integer', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{ceil 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{ceil }}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });
  });

  describe('Helper: floor', () => {
    it('should floor a number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{floor 0.5}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0');
    });

    it('should floor a number described by a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{floor '0.5'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0');
    });

    it('should return the base value when given an integer', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{floor 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{floor }}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });
  });

  describe('Helper: round', () => {
    it('should round a number up when min .5', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{round 0.5}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1');
    });

    it('should round a number down when smaller than .5', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{round 0.499}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0');
    });

    it('should take a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{round "0.499"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0');
    });

    it('should return empty string if no parameters', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{round}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });
  });

  describe('Helper: toFixed', function () {
    it('should fix the number to correct format', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{toFixed 1.11111 2}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1.11');
    });

    it('should delete all decimal places if no fix value is given', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{toFixed 2.11111}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '2');
    });

    it('should return 0 if no values are given', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{toFixed}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0');
    });

    it('should return 0 if wrong values are given as number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{toFixed "hi"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '0');
    });
  });

  describe('Helper: gt', function () {
    it('should return true if first number is bigger than second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{gt 1.11111 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });

    it('should return false if first number is smaller than second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{gt 1.11111 1.2}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });

    it('should return false if first number is equal to the second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{gt 1 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });
  });

  describe('Helper: gt', function () {
    it('should return true if first number is bigger than second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{gt 1.11111 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });

    it('should return false if first number is smaller than second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{gt 1.11111 1.2}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });

    it('should return false if first number is equal to the second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{gt 1 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });
  });

  describe('Helper: gte', function () {
    it('should return true if first number is bigger than second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{gte 1.11111 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });

    it('should return false if first number is smaller than second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{gte 1.11111 1.2}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });

    it('should return true if first number is equal to the second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{gte 1 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });
  });

  describe('Helper: lt', function () {
    it('should return true if second number is bigger than first number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{lt 1 2}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });

    it('should return false if second number is bigger than second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{lt 2 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });

    it('should return false if first number is equal to the second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{lt 1 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });
  });

  describe('Helper: lte', function () {
    it('should return true if second number is bigger than first number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{lte 1 2}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });

    it('should return false if second number is bigger than second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{lte 2 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });

    it('should return true if first number is equal to the second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{lte 1 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });
  });

  describe('Helper: eq', function () {
    it('should return false if second number is bigger than first number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{eq 1 2}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });

    it('should return false if second number is bigger than second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{eq 2 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });

    it('should return true if first number is equal to the second number', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{eq 1 1}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });

    it('should return false if first number is number and second is string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{eq 1 "1"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });

    it('should return true if first value is string equal to second string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{eq "v1" "v1"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'true');
    });

    it('should return false if first value is string and not equal to second string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{eq "v1" "v11"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'false');
    });
  });

  describe('Helper: stringify', () => {
    it('should output objects as string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{{stringify (bodyRaw "prop2")}}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            prop1: '123',
            prop2: {
              data: 'super'
            }
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        `{
  "data": "super"
}`
      );
    });

    it('should output objects as string, and support safestrings', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{"result": {{{stringify (data \'data\')}}} }',
        environment: {} as any,
        processedDatabuckets: [
          {
            id: 'abcd',
            name: 'data',
            parsed: true,
            value: {
              myarr: [1, 2, 3]
            },
            uuid: '',
            validJson: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '{"result": "{\\"myarr\\":[1,2,3]}" }');
    });
  });

  describe('Helper: jsonParse', () => {
    it('should return nothing if first string parameter is missing', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{jsonParse}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return nothing if first string parameter is empty', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{jsonParse ""}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return nothing if first parameter is not a string', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{jsonParse 56}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return content if string evaluated to true', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{#if (jsonParse "true")}}value{{/if}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'value');
    });

    it('should return content if string evaluated to number verifying equality', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{#if (eq (jsonParse "25") 25)}}value{{/if}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'value');
    });

    it('should return data property if string evaluated to object', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{lookup (jsonParse \'{"data":"test"}\') \'data\'}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'test');
    });

    it('should return array element when used with oneOf and string evaluated as an array', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{oneOf (jsonParse '[5]')}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            prop1: '123',
            prop2: {
              data: 'super'
            }
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '5');
    });

    it('should return correct data property when evaluating string coming from a SafeString helper (queryParam)', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: "{{lookup (jsonParse (queryParam 'json')) 'data'}}",
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          query: {
            json: '{"data":"test"}'
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'test');
    });
  });

  describe('Helper: padStart', () => {
    it('should return empty string if no param provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{padStart}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return string as is if no length and no padchar', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{padStart (bodyRaw "prop1")}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            prop1: '123'
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '123');
    });

    it('should return string padded with spaces if no padchar', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{padStart (bodyRaw "prop1") 10}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            prop1: '123'
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '       123');
    });

    it('should return string padded with chosen char', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{padStart (bodyRaw "prop1") 10 "*"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            prop1: '123'
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '*******123');
    });
  });

  describe('Helper: padEnd', () => {
    it('should return empty string if no param provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{padEnd}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return string as is if no length and no padchar', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{padEnd (bodyRaw "prop1")}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            prop1: '123'
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '123');
    });

    it('should return string padded with spaces if no padchar', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{padEnd (bodyRaw "prop1") 10}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            prop1: '123'
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '123       ');
    });

    it('should return string padded with chosen char', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{padEnd (bodyRaw "prop1") 10 "*"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          body: {
            prop1: '123'
          }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '123*******');
    });
  });

  describe('Helper: oneOf', () => {
    it('should return empty string if no param provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{oneOf}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return empty string if first param is not an array', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{oneOf true}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return a stringified object if choses from array of object and stringify is true', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{oneOf (dataRaw "abc1") true}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            id: 'abc1',
            name: 'db1',
            parsed: true,
            value: [{ id: 1, value: 'value1' }],
            uuid: '',
            validJson: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '{"id":1,"value":"value1"}');
    });

    it('should return an [object Object] string if choses from array of object and stringify is false', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{oneOf (dataRaw "abc1")}}',
        environment: {} as any,
        processedDatabuckets: [
          {
            id: 'abc1',
            name: 'db1',
            parsed: true,
            value: [{ id: 1, value: 'value1' }],
            uuid: '',
            validJson: true
          }
        ],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '[object Object]');
    });
  });

  describe('Helper: object', () => {
    it('should return an empty object if empty object passed', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{ stringify (object) }}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '{}');
    });

    it('should return valid key=value object if key=value passed', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{{ stringify (object key="value") }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, JSON.stringify({ key: 'value' }, null, 2));
    });

    it('should return valid multiple keys object if multiple keys passed', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{{ stringify (object key="value" secondKey="secondValue" numericKey=5) }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        JSON.stringify(
          {
            numericKey: 5,
            secondKey: 'secondValue',
            key: 'value'
          },
          null,
          2
        )
      );
    });
  });

  describe('Helper: objectMerge', () => {
    it('should return nothing when no parameter provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{{ stringify (objectMerge) }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { test: 'value' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return a new object after merging multiple parameters', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{{ stringify (objectMerge (object id=12) (bodyRaw)) }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { body: { test: 'value' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '{\n  "id": 12,\n  "test": "value"\n}');
    });
  });

  describe('Helper: filter', () => {
    it('should return correctly filtered array with primitives OR condition', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{ stringify (filter (array 1 2 3 4 true false) 3 1 true) }}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, JSON.stringify([1, 3, true], null, 2));
    });

    it('should return correctly filtered array with mixed data OR condition', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{{ stringify (filter (array (object key="value") 2 3) (object key="value") 3) }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, JSON.stringify([{ key: 'value' }, 3], null, 2));
    });

    it('should return correctly filtered array with mixed AND condition', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{{ stringify (filter (array (object a="a1" b="b2") (object a="a1" b="b1") 2 3) (object a="a1" b="b1") 3) }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        JSON.stringify([{ b: 'b1', a: 'a1' }, 3], null, 2)
      );
    });

    it('should return correctly return array filtered by nested values', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{{ stringify (filter (array (object parent=(object child="child-val") b="b1") (object parent=(object child="child-val2") b="b2") 2 3) (object parent=(object child="child-val"))) }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        JSON.stringify([{ b: 'b1', parent: { child: 'child-val' } }], null, 2)
      );
    });

    it('should return correctly return array filtered array when nested value not equals', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{{ stringify (filter (array (object parent=(object child="child-val") b="b1") (object parent=(object child="child-val2") b="b2") 2 3) (object parent="parent-val")) }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, JSON.stringify([], null, 2));
    });
  });

  describe('Helper: find', () => {
    it('should return the first item matching the condition', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{{ stringify (find (array (object b="b1" a="a1") (object b="b2" a="a2") 3) (object b="b1")) }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, JSON.stringify({ a: 'a1', b: 'b1' }, null, 2));
    });

    it('should return the first item matching nested values', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{{ stringify (find (array (object parent=(object child="child-val") b="b1") (object parent=(object child="child-val2") b="b2") 2 3) (object parent=(object child="child-val"))) }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        JSON.stringify({ b: 'b1', parent: { child: 'child-val' } }, null, 2)
      );
    });

    it('should return undefined when no item matches the condition', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{{ stringify (find (array (object parent=(object child="child-val") b="b1") (object parent=(object child="child-val2") b="b2") 2 3) (object parent="parent-val")) }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });
  });

  describe('Helper: sort', () => {
    it('should return correctly sorted array of numbers in ascending order', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{ sort (array 41 10 99)}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '10,41,99');
    });

    it('should return correctly sorted array of numbers in descending order', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{ sort (array 41 10 99) "desc"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '99,41,10');
    });

    it('should return correctly sorted array of strings in ascending order', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{ sort (array "foo" "bar" "baz")}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'bar,baz,foo');
    });

    it('should return correctly sorted array of strings in descending order', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{ sort (array "foo" "bar" "baz") "desc"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'foo,baz,bar');
    });

    it('should return reversed array of numbers in descending order', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{ sort (array 41 10 99) "desc"}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '99,41,10');
    });
  });

  describe('Helper: sortBy', () => {
    it('should return correctly sorted array of object with numberic values in ascending order', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{{ stringify (sortBy (array (object key1=10 key2=20) (object key1=30 key2=30) (object key1=15 key2=25)) "key1") }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        `[
  {
    "key2": 20,
    "key1": 10
  },
  {
    "key2": 25,
    "key1": 15
  },
  {
    "key2": 30,
    "key1": 30
  }
]`
      );
    });

    it('should return correctly sorted array of object with numberic values in ascending order', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{{ stringify (sortBy (array (object key1=10 key2=20) (object key1=30 key2=30) (object key1=15 key2=25)) "key1" "desc") }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        `[
  {
    "key2": 30,
    "key1": 30
  },
  {
    "key2": 25,
    "key1": 15
  },
  {
    "key2": 20,
    "key1": 10
  }
]`
      );
    });

    it('should return correctly sorted array of object with string values in ascending order', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{{ stringify (sortBy (array (object key1="foo" key2=20) (object key1="bar" key2=30) (object key1="baz" key2=25)) "key1") }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        `[
  {
    "key2": 30,
    "key1": "bar"
  },
  {
    "key2": 25,
    "key1": "baz"
  },
  {
    "key2": 20,
    "key1": "foo"
  }
]`
      );
    });

    it('should return correctly sorted array of object with string values in ascending order', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content:
          '{{{ stringify (sortBy (array (object key1="foo" key2=20) (object key1="bar" key2=30) (object key1="baz" key2=25)) "key1" "desc") }}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        `[
  {
    "key2": 20,
    "key1": "foo"
  },
  {
    "key2": 25,
    "key1": "baz"
  },
  {
    "key2": 30,
    "key1": "bar"
  }
]`
      );
    });
  });
});

describe('Helper: jwt', () => {
  const jwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  describe('jwtPayload', () => {
    it('should return nothing when jwt is missing', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{ jwtPayload }}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return full payload object when no key', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: `{{{ stringify (jwtPayload '${jwt}') }}}`,
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(
        parseResult,
        '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}'
      );
    });

    it('should return sub key when key provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: `{{jwtPayload '${jwt}' 'sub'}}`,
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1234567890');
    });

    it('should get params from safestring', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{jwtPayload (queryParam "jwt") (queryParam "key")}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { jwt, key: 'sub' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1234567890');
    });

    it('should automatically get rid of "Bearer "', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{jwtPayload (header "Authorization") (queryParam "key")}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          get: () => `Bearer ${jwt}`,
          query: { key: 'sub' }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '1234567890');
    });
  });

  describe('jwtHeader', () => {
    it('should return nothing when jwt is missing', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{ jwtHeader }}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '');
    });

    it('should return full payload object when no key', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: `{{{ stringify (jwtHeader '${jwt}') }}}`,
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, '{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
    });

    it('should return alg key when key provided', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: `{{jwtHeader '${jwt}' 'alg'}}`,
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {} as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'HS256');
    });

    it('should get params from safestring', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{jwtHeader (queryParam "jwt") (queryParam "key")}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: { query: { jwt, key: 'alg' } } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'HS256');
    });

    it('should automatically get rid of "Bearer "', () => {
      const parseResult = TemplateParser({
        shouldOmitDataHelper: false,
        content: '{{jwtHeader (header "Authorization") (queryParam "key")}}',
        environment: {} as any,
        processedDatabuckets: [],
        globalVariables: {},
        request: {
          get: () => `Bearer ${jwt}`,
          query: { key: 'alg' }
        } as any,
        envVarsPrefix: ''
      });
      strictEqual(parseResult, 'HS256');
    });
  });
});
