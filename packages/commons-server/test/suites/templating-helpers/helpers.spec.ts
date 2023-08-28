import { faker } from '@faker-js/faker';
import { expect } from 'chai';
import { format as dateFormat } from 'date-fns';
import { TemplateParser } from '../../../src/libs/template-parser';

faker.seed(1);

describe('Template parser', () => {
  describe('Helper: switch', () => {
    it('should return different values depending on the string value', () => {
      const parseResult = TemplateParser(
        false,
        '{{#switch (body "prop1")}}{{#case "value1"}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        {} as any,
        [],
        {
          body: { prop1: 'value1' }
        } as any
      );
      expect(parseResult).to.be.equal('value1');
    });

    it('should return default values depending on the string value', () => {
      const parseResult = TemplateParser(
        false,
        '{{#switch (body "prop1")}}{{#case "value1"}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        {} as any,
        [],
        { body: { prop1: 'defaultvalue' } } as any
      );
      expect(parseResult).to.be.equal('defaultvalue');
    });

    it('should return different values depending on the index', () => {
      const parseResult = TemplateParser(
        false,
        '{{#repeat 2 comma=false}}{{@index}}{{#switch @index}}{{#case 0}}John{{/case}}{{#default}}Peter{{/default}}{{/switch}}{{/repeat}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('0John1Peter');
    });

    it('should return different values depending on the boolean value', () => {
      const parseResult = TemplateParser(
        false,
        '{{#switch (bodyRaw "prop1")}}{{#case true}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        {} as any,
        [],
        { body: { prop1: true } } as any
      );
      expect(parseResult).to.be.equal('value1');
    });

    it('should return different values depending on the boolean value', () => {
      const parseResult = TemplateParser(
        false,
        '{{#switch (bodyRaw "prop1")}}{{#case true}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        {} as any,
        [],
        { body: { prop1: false } } as any
      );
      expect(parseResult).to.be.equal('defaultvalue');
    });
  });

  describe('Helper: concat', () => {
    it('should concat two strings', () => {
      const parseResult = TemplateParser(
        false,
        "{{concat 'test' 'test'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('testtest');
    });

    it('should concat two strings and repeat index', () => {
      const parseResult = TemplateParser(
        false,
        "{{#repeat 1 comma=false}}{{concat 'test' @index 'test'}}{{/repeat}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('test0test');
    });

    it('should concat two strings and the result of a helper', () => {
      const parseResult = TemplateParser(
        false,
        "{{#repeat 1 comma=false}}{{concat 'test' (body 'id') 'test'}}{{/repeat}}",
        {} as any,
        [],
        { body: { id: '123' } } as any
      );
      expect(parseResult).to.be.equal('test123test');
    });

    it('should concat two strings and number', () => {
      const parseResult = TemplateParser(
        false,
        "{{concat 'test' 123 'test'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('test123test');
    });

    it('should concat object path to retrieve body array items', () => {
      const parseResult = TemplateParser(
        false,
        "{{#repeat 2 comma=false}}item_{{body (concat 'a.' @index '.item')}}{{/repeat}}",
        {} as any,
        [],
        { body: { a: [{ item: 10 }, { item: 20 }] } } as any
      );
      expect(parseResult).to.be.equal('item_10item_20');
    });
  });

  describe('Helper: setVar', () => {
    it('should set a variable to a string', () => {
      const parseResult = TemplateParser(
        false,

        "{{setVar 'testvar' 'testvalue'}}{{@testvar}}",

        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('testvalue');
    });

    it('should set a variable to a number', () => {
      const parseResult = TemplateParser(
        false,
        "{{setVar 'testvar' 123}}{{@testvar}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('123');
    });

    it('should set a variable value to body helper result', () => {
      const parseResult = TemplateParser(
        false,
        "{{setVar 'testvar' (body 'uuid')}}{{@testvar}}",
        {} as any,
        [],
        { body: { uuid: '0d35618e-5e85-4c09-864d-6d63973271c8' } } as any
      );
      expect(parseResult).to.be.equal('0d35618e-5e85-4c09-864d-6d63973271c8');
    });

    it('should set a variable value to oneOf helper result', () => {
      const parseResult = TemplateParser(
        false,
        "{{setVar 'testvar' (oneOf (array 'item1'))}}{{@testvar}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('item1');
    });

    it('should set a variable and use it in another helper', () => {
      const parseResult = TemplateParser(
        false,
        "{{setVar 'testvar' 5}}{{#repeat @testvar comma=false}}test{{/repeat}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('testtesttesttesttest');
    });

    it('should set a variable in a different scope: repeat', () => {
      const parseResult = TemplateParser(
        false,
        "{{#repeat 5 comma=false}}{{setVar 'testvar' @index}}{{@testvar}}{{/repeat}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('01234');
    });

    it('should set a variable in root scope and child scope: repeat', () => {
      const parseResult = TemplateParser(
        false,

        "{{setVar 'outsidevar' 'test'}}{{@outsidevar}}{{#repeat 5 comma=false}}{{setVar 'testvar' @index}}{{@testvar}}{{@outsidevar}}{{/repeat}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('test0test1test2test3test4test');
    });

    it('should set variables in two nested repeat', () => {
      const parseResult = TemplateParser(
        false,
        "{{#repeat 1 comma=false}}{{setVar 'itemId' 25}}Item:{{@itemId}}{{setVar 'nb' 1}}{{#repeat @nb comma=false}}{{setVar 'childId' 56}}Child:{{@childId}}parent:{{@itemId}}{{/repeat}}{{/repeat}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('Item:25Child:56parent:25');
    });

    it('should set variables in a each', () => {
      const parseResult = TemplateParser(
        false,
        "{{#each (split '1 2')}}{{setVar 'item' this}}{{@item}}{{/each}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('12');
    });

    it('should set variables in a each in a repeat', () => {
      const parseResult = TemplateParser(
        false,
        "{{#repeat 2 comma=false}}{{setVar 'repeatvar' 'repeatvarvalue'}}{{#each (split '1 2')}}{{setVar 'item' this}}{{@repeatvar}}{{@item}}{{/each}}{{/repeat}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal(
        'repeatvarvalue1repeatvarvalue2repeatvarvalue1repeatvarvalue2'
      );
    });

    it('should set variables in two each', () => {
      const parseResult = TemplateParser(
        false,
        "{{#each (split '1 2')}}{{setVar 'each1var' 'each1varvalue'}}{{#each (split '1 2')}}{{setVar 'each2var' this}}{{@each1var}}{{@each2var}}{{/each}}{{/each}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal(
        'each1varvalue1each1varvalue2each1varvalue1each1varvalue2'
      );
    });

    it('should set a variable to empty value if none provided', () => {
      const parseResult = TemplateParser(
        false,
        "{{setVar 'testvar'}}{{@testvar}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should not set a variable if no name provided', () => {
      const parseResult = TemplateParser(
        false,
        "{{setVar ''}}{{@testvar}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });
  });

  describe('Helper: getVar', () => {
    it('should return empty if no var name provided', () => {
      const parseResult = TemplateParser(
        false,

        "{{setVar 'testvar' 'testvalue'}}{{getVar}}",

        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should get a variable from simple var name', () => {
      const parseResult = TemplateParser(
        false,

        "{{setVar 'testvar' 'testvalue'}}{{getVar 'testvar'}}",

        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('testvalue');
    });

    it('should get a variable from dynamically built var name', () => {
      const parseResult = TemplateParser(
        false,

        "{{setVar 'testvar' 'testvalue'}}{{getVar (concat 'test' 'var')}}",

        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('testvalue');
    });

    it('should get a variable from dynamically built var name', () => {
      const parseResult = TemplateParser(
        false,

        "{{setVar 'testvar' 'testvalue'}}{{getVar (bodyRaw 'prop1')}}",

        {} as any,
        [],
        { body: { prop1: 'testvar' } } as any
      );
      expect(parseResult).to.be.equal('testvalue');
    });
  });

  describe('Helper: date', () => {
    it('should return an empty string if given the wrong amount of arguments', () => {
      const parseResult = TemplateParser(
        false,
        '{{date}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return an empty string if given the wrong amount of arguments', () => {
      const parseResult = TemplateParser(
        false,
        "{{date '2022-01-01'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('');
    });

    it('should return a date using a the default format', () => {
      const parseResult = TemplateParser(
        false,
        "{{date '2022-01-01' '2022-02-01' 'YYYY'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('2022');
    });

    it('should return a date using a given format', () => {
      const parseResult = TemplateParser(
        false,
        "{{date '2022-02-01' '2022-02-01' 'yyyy-MM-dd'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('2022-02-01');
    });

    it('should return a date when using queryParams', () => {
      const parseResult = TemplateParser(
        false,
        "{{date (queryParam 'dateFrom') (queryParam 'dateTo') 'YYYY'}}",
        {
          query: {
            dateFrom: '2022-06-01T00:00:00.000Z',
            dateTo: '2022-06-03T12:00:00.000Z'
          }
        } as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('2023');
    });
  });

  describe('Helper: dateFormat', () => {
    it('should return an empty string if given the wrong amount of arguments', () => {
      const parseResult = TemplateParser(
        false,
        '{{dateFormat}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return an empty string if given the wrong amount of arguments', () => {
      const parseResult = TemplateParser(
        false,
        "{{dateFormat '2022-01-01'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('');
    });

    it('should return a date using a given format', () => {
      const parseResult = TemplateParser(
        false,
        "{{dateFormat '2022-02-01' 'YYYY'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('2022');
    });

    it('should return a date using a given format, when a Date object is passed as a param', () => {
      const parseResult = TemplateParser(
        false,
        "{{dateFormat (faker 'date.recent' 1) 'YYYY'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('2023');
    });
  });

  describe('Helper: dateTimeShift', () => {
    it('should not throw an error when passed with invalid parameters.', () => {
      const parseResult = TemplateParser(
        false,
        '{{dateTimeShift 1}}',
        {} as any,
        [],
        {} as any
      );

      // When invalid parameters are passed, the default should just be to return the current date with no shift.
      const date = new Date();
      const dateString = dateFormat(date, "yyyy-MM-dd'T'HH:mm");
      expect(parseResult).to.match(new RegExp(dateString + '.*'));
    });

    it('should return a date shifted the specified amount of days from now.', () => {
      const parseResult = TemplateParser(
        false,
        '{{dateTimeShift days=2}}',
        {} as any,
        [],
        {} as any
      );

      const date = new Date();
      date.setDate(date.getDate() + 2);
      // As our reference date here may differ slightly from the one interally used in the helper, it's more reliable to just compare the date/time with the seconds (and lower) excluded.
      const dateString = dateFormat(date, "yyyy-MM-dd'T'HH:mm");
      expect(parseResult).to.match(new RegExp(dateString + '.*'));
    });

    it('should return a date shifted by the requested amount from a specified start date.', () => {
      const parseResult = TemplateParser(
        false,
        "{{dateTimeShift date='2021-02-01' days=2 months=4}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.match(/2021-06-03.*/);
    });

    it('should return a date shifted by the requested amount from the specified start date in the specified format.', () => {
      const parseResult = TemplateParser(
        false,
        "{{dateTimeShift date='2021-02-01' format='yyyy-MM-dd' days=2 months=4}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.equals('2021-06-03');
    });

    it('should return a date time shifted by the requested amount from the specified start date in the specified format.', () => {
      const parseResult = TemplateParser(
        false,
        "{{dateTimeShift date='2021-02-01T10:45:00' format=\"yyyy-MM-dd'T'HH:mm:ss\" days=8 months=3 hours=1 minutes=2 seconds=3}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.equals('2021-05-09T11:47:03');
    });

    it('should return a date time shifted by the requested amount when another helper is used as the date source (safestring).', () => {
      const parseResult = TemplateParser(
        false,
        "{{dateTimeShift date=(queryParam 'date') format=\"yyyy-MM-dd'T'HH:mm:ss\" hours=1}}",
        {} as any,
        [],
        { query: { date: '2021-01-01 05:00:00' } } as any
      );

      expect(parseResult).to.equals('2021-01-01T06:00:00');
    });

    it('should return a date time shifted by the requested amount when another helper is used as the date and months and days source (safestring).', () => {
      const parseResult = TemplateParser(
        false,
        "{{dateTimeShift date=(queryParam 'date') format=\"yyyy-MM-dd\" days=(queryParam 'days') months=(queryParam 'months')}}",
        {} as any,
        [],
        { query: { date: '2021-01-01', months: 1, days: 1 } } as any
      );

      expect(parseResult).to.equals('2021-02-02');
    });
  });

  describe('Helper: includes', () => {
    it('should return true if a string includes a search string', () => {
      const parseResult = TemplateParser(
        false,
        "{{includes 'testdata' 'test'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('true');
    });

    it('should return false if a string does not include a search string', () => {
      const parseResult = TemplateParser(
        false,
        "{{includes 'testdata' 'not'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('false');
    });

    it('should not fail when passing no parameters', () => {
      const parseResult = TemplateParser(
        false,
        '{{includes}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('true');
    });

    it('should not fail when passing only one parameter', () => {
      const parseResult = TemplateParser(
        false,
        "{{includes 'testdata'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('true');
    });
  });

  describe('Helper: substr', () => {
    it('should return a substring of the provided string', () => {
      const parseResult = TemplateParser(
        false,
        "{{substr 'testdata' 4 4}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should work correctly when from and length parameters are passed as strings', () => {
      const parseResult = TemplateParser(
        false,
        "{{substr 'testdata' '4' '4'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should return a substring of the provided string to the end when the length parameter is excluded (from as a number)', () => {
      const parseResult = TemplateParser(
        false,
        "{{substr 'testdata' 4}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should return a substring of the provided string to the end when the length parameter is excluded (from as a string)', () => {
      const parseResult = TemplateParser(
        false,
        "{{substr 'testdata' '4'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should work correctly when variables are passed as parameters as numbers', () => {
      const parseResult = TemplateParser(
        false,
        "{{setVar 'testvar' 'testdata'}}{{setVar 'from' 4}}{{setVar 'length' 4}}{{substr @testvar @from @length}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should work correctly when variables are passed as parameters as strings', () => {
      const parseResult = TemplateParser(
        false,
        "{{setVar 'testvar' 'testdata'}}{{setVar 'from' '4'}}{{setVar 'length' '4'}}{{substr @testvar @from @length}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should work correctly when other helpers are used for parameters as numbers', () => {
      const parseResult = TemplateParser(
        false,
        "{{substr (body 'prop1') (body 'prop2') (body 'prop3')}}",
        {} as any,
        [],
        { body: { prop1: 'testdata', prop2: 4, prop3: 4 } } as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should work correctly when other helpers are used for parameters as strings', () => {
      const parseResult = TemplateParser(
        false,
        "{{substr (body 'prop1') (body 'prop2') (body 'prop3')}}",
        {} as any,
        [],
        { body: { prop1: 'testdata', prop2: '4', prop3: '4' } } as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should not fail when passing no parameters', () => {
      const parseResult = TemplateParser(
        false,
        '{{substr}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('');
    });

    it('should not fail when passing only one parameter', () => {
      const parseResult = TemplateParser(
        false,
        "{{substr 'testdata'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('testdata');
    });
  });

  describe('Helper: split', () => {
    it('should split a string using spaces as separator', () => {
      const parseResult = TemplateParser(
        false,
        '{{split "I love dolphins" " "}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('I,love,dolphins');
    });

    it('should split a string using commas', () => {
      const parseResult = TemplateParser(
        false,
        '{{split "I too, love dolphins" ","}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('I too, love dolphins');
    });

    it('should split a string using spaces by default', () => {
      const parseResult = TemplateParser(
        false,
        '{{split "I love dolphins"}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('I,love,dolphins');
    });

    it('should split a string using spaces when given anything else but a string as separator', () => {
      const parseResult = TemplateParser(
        false,
        '{{split "I love dolphins" 123}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('I,love,dolphins');
    });

    it('should return an empty string when given anything else but a string as data', () => {
      const parseResult = TemplateParser(
        false,
        '{{split 123 ","}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('');
    });

    it('should be usable within a #each', () => {
      const parseResult = TemplateParser(
        false,
        '{{#each (split "1 2 3" " ")}}dolphin,{{/each}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('dolphin,dolphin,dolphin,');
    });

    it('should be compatible with SafeString (queryParam)', () => {
      const parseResult = TemplateParser(
        false,
        "{{#each (split (queryParam 'param1') ',')}}item{{this}},{{/each}}",
        {} as any,
        [],
        { query: { param1: '123,456,789' } } as any
      );

      expect(parseResult).to.be.equal('item123,item456,item789,');
    });
  });

  describe('Helper: lowercase', () => {
    it('should return nothing when no parameter is passed', () => {
      const parseResult = TemplateParser(
        false,
        '{{lowercase}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('');
    });

    it('should lowercase a string', () => {
      const parseResult = TemplateParser(
        false,
        '{{lowercase "ABCD"}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('abcd');
    });

    it('should be usable within a #switch', () => {
      const parseResult = TemplateParser(
        false,
        '{{#switch (lowercase "ABCD")}}{{#case "abcd"}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('value1');
    });

    it('should be compatible with SafeString (queryParam)', () => {
      const parseResult = TemplateParser(
        false,
        "{{lowercase (queryParam 'param1')}}",
        {} as any,
        [],
        { query: { param1: 'ABCD' } } as any
      );

      expect(parseResult).to.be.equal('abcd');
    });
  });

  describe('Helper: uppercase', () => {
    it('should return nothing when no parameter is passed', () => {
      const parseResult = TemplateParser(
        false,
        '{{uppercase}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('');
    });

    it('should uppercase a string', () => {
      const parseResult = TemplateParser(
        false,
        '{{uppercase "abcd"}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('ABCD');
    });

    it('should be usable within a #switch', () => {
      const parseResult = TemplateParser(
        false,
        '{{#switch (uppercase "abcd")}}{{#case "ABCD"}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('value1');
    });

    it('should be compatible with SafeString (queryParam)', () => {
      const parseResult = TemplateParser(
        false,
        "{{uppercase (queryParam 'param1')}}",
        {} as any,
        [],
        { query: { param1: 'abcd' } } as any
      );

      expect(parseResult).to.be.equal('ABCD');
    });
  });

  describe('Helper: parseInt', () => {
    it('should return nothing when no parameter is passed', () => {
      const parseResult = TemplateParser(
        false,
        '{{parseInt}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('');
    });

    it('should parse string and return an int', () => {
      const parseResult = TemplateParser(
        false,
        "{{parseInt 'zero'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('');
    });

    it('should parse string and return an int', () => {
      const parseResult = TemplateParser(
        false,
        "{{parseInt '10'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('10');
    });
  });

  describe('Helper: join', () => {
    it('should join an Array with spaces', () => {
      const parseResult = TemplateParser(
        false,
        '{{join (array "Mockoon" "is" "nice") " "}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('Mockoon is nice');
    });

    it('should ignore non Array values and return same value', () => {
      const parseResult = TemplateParser(
        false,
        '{{join "I too, love dolphins" " "}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('I too, love dolphins');
    });

    it('should use comma separator if no separator was provided', () => {
      const parseResult = TemplateParser(
        false,
        '{{join (array "Water" "Tea" "Coffee")}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('Water, Tea, Coffee');
    });
  });

  describe('Helper: slice', () => {
    it('should return an empty string if parameter is not an array', () => {
      const parseResult = TemplateParser(
        false,
        '{{slice "hello"}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('');
    });

    it('should return the stringified array (same content)', () => {
      const parseResult = TemplateParser(
        false,
        '{{slice (array "Mockoon" "is" "very" "nice")}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('Mockoon,is,very,nice');
    });

    it('should return the stringified first two elements', () => {
      const parseResult = TemplateParser(
        false,
        '{{slice (array "Mockoon" "is" "very" "nice") 0 2}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('Mockoon,is');
    });

    it('should return the stringified last two elements', () => {
      const parseResult = TemplateParser(
        false,
        '{{slice (array "Mockoon" "is" "very" "nice") 2}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('very,nice');
    });
  });

  describe('Helper: indexOf', () => {
    it('should return the index of a matching substring', () => {
      const parseResult = TemplateParser(
        false,
        "{{indexOf 'testdata' 'data'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('4');
    });

    it('should return the index of a matching substring from a given starting position', () => {
      const parseResult = TemplateParser(
        false,
        "{{indexOf 'testdatadata' 'data' 6}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('8');
    });

    it('should still work correctly if the position parameter is passed as a string', () => {
      const parseResult = TemplateParser(
        false,
        "{{indexOf 'testdatadata' 'data' '6'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('8');
    });

    it('should be possible to search for a number', () => {
      const parseResult = TemplateParser(
        false,
        "{{indexOf 'testdata12345' 3}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('10');
    });

    it('should be possible to search for a number (as a string)', () => {
      const parseResult = TemplateParser(
        false,
        "{{indexOf 'testdata12345' '3'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('10');
    });

    it('Can return the index from a previously set variable', () => {
      const parseResult = TemplateParser(
        false,
        "{{setVar 'testvar' 'this is a test'}}{{indexOf @testvar 'test'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('10');
    });

    it('Can return the index from a previously set variable using a variable for the search string', () => {
      const parseResult = TemplateParser(
        false,
        "{{setVar 'testvar' 'this is a test'}}{{setVar 'searchstring' 'test'}}{{indexOf @testvar @searchstring}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('10');
    });

    it('Can return the index from a body property', () => {
      const parseResult = TemplateParser(
        false,
        "{{indexOf (body 'prop1') (body 'prop2')}}",
        {} as any,
        [],
        { body: { prop1: 'First test then test', prop2: 'test' } } as any
      );

      expect(parseResult).to.be.equal('6');
    });

    it('Can return the index from a body property with a position', () => {
      const parseResult = TemplateParser(
        false,
        "{{indexOf (body 'prop1') (body 'prop2') (body 'prop3')}}",
        {} as any,
        [],
        {
          body: {
            prop1: 'First test then test',
            prop2: 'test',
            prop3: 10
          }
        } as any
      );

      expect(parseResult).to.be.equal('16');
    });

    it('should not fail when passing no parameters', () => {
      const parseResult = TemplateParser(
        false,
        '{{indexOf}}',
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('0');
    });

    it('should not fail when passing only one parameter', () => {
      const parseResult = TemplateParser(
        false,
        "{{indexOf 'testdata'}}",
        {} as any,
        [],
        {} as any
      );

      expect(parseResult).to.be.equal('0');
    });
  });

  describe('Helper: someOf', () => {
    it('should return one element', () => {
      const parseResult = TemplateParser(
        false,
        "{{someOf (array 'value1' 'value2' 'value3' 'value4' 'value5' 'value6') 1 1}}",
        {} as any,
        [],
        {} as any
      );

      const count = (parseResult.match(/value/g) || []).length;
      expect(count).to.equal(1);
    });

    it('should return 1 to 3 elements', () => {
      const parseResult = TemplateParser(
        false,
        "{{someOf (array 'value1' 'value2' 'value3' 'value4' 'value5' 'value6') 1 3}}",
        {} as any,
        [],
        {} as any
      );

      const countItems = (parseResult.match(/value/g) || []).length;
      expect(countItems).is.least(1);
      expect(countItems).is.most(3);

      const countSeparators = (parseResult.match(/,/g) || []).length;
      expect(countSeparators).is.least(0);
      expect(countSeparators).is.most(2);
    });

    it('should return 1 to 3 elements as array', () => {
      const parseResult = TemplateParser(
        false,
        "{{someOf (array 'value1' 'value2' 'value3' 'value4' 'value5' 'value6') 1 3 true}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult.match(/^\[.*\]$/)?.length).to.equal(1);
      const countItems = (parseResult.match(/value/g) || []).length;
      expect(countItems).is.least(1);
      expect(countItems).is.most(3);

      const countSeparators = (parseResult.match(/,/g) || []).length;
      expect(countSeparators).is.least(0);
      expect(countSeparators).is.most(2);
    });
  });

  describe('Helper: len', () => {
    it('should return the length of an array', () => {
      const parseResult = TemplateParser(
        false,
        '{{len (array 1 2 3)}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('3');
    });

    it('should return the length of a string', () => {
      const parseResult = TemplateParser(
        false,
        '{{len "Cowboy"}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('6');
    });

    it('should return 0 if value is not an array', () => {
      const parseResult = TemplateParser(
        false,
        '{{len true}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should return 0 if no value was provided', () => {
      const parseResult = TemplateParser(
        false,
        '{{len}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });
  });

  describe('Helper: base64', () => {
    it('should encode string to base64', () => {
      const parseResult = TemplateParser(
        false,
        "{{base64 'abc'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('YWJj');
    });

    it('should encode body property to base64', () => {
      const parseResult = TemplateParser(
        false,
        "{{base64 (body 'prop1')}}",
        {} as any,
        [],
        { body: { prop1: '123' } } as any
      );
      expect(parseResult).to.be.equal('MTIz');
    });

    it('should encode block to base64', () => {
      const parseResult = TemplateParser(
        false,
        "{{#base64}}value: {{body 'prop1'}}{{/base64}}",
        {} as any,
        [],
        { body: { prop1: '123' } } as any
      );
      expect(parseResult).to.be.equal('dmFsdWU6IDEyMw==');
    });
  });

  describe('Helper: base64', () => {
    it('should decode a string from base64', () => {
      const parseResult = TemplateParser(
        false,
        "{{base64Decode 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkw'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('abcdefghijklmnopqrstuvwxyz1234567890');
    });

    it('should decode body property from base64', () => {
      const parseResult = TemplateParser(
        false,
        "{{base64Decode (body 'prop1')}}",
        {} as any,
        [],
        {
          body: { prop1: 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkw' }
        } as any
      );
      expect(parseResult).to.be.equal('abcdefghijklmnopqrstuvwxyz1234567890');
    });

    it('should decode block from base64', () => {
      const parseResult = TemplateParser(
        false,
        "{{#base64Decode}}YWJjZGVmZ2hpamtsbW5vcHF{{body 'prop1'}}{{/base64Decode}}",
        {} as any,
        [],
        { body: { prop1: 'yc3R1dnd4eXoxMjM0NTY3ODkw' } } as any
      );
      expect(parseResult).to.be.equal('abcdefghijklmnopqrstuvwxyz1234567890');
    });
  });

  describe('Helper: add', () => {
    it('should add a number to another', () => {
      const parseResult = TemplateParser(
        false,
        '{{add 1 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('2');
    });

    it('should add the number described by a string to another number described by a string', () => {
      const parseResult = TemplateParser(
        false,
        "{{add '1' '1'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('2');
    });

    it('should return the base value when given a single parameter', () => {
      const parseResult = TemplateParser(
        false,
        '{{add 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser(
        false,
        '{{add }}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should add the body property to the initial value', () => {
      const parseResult = TemplateParser(
        false,
        "{{add 1 (body 'prop1')}}",
        {} as any,
        [],
        { body: { prop1: '123' } } as any
      );
      expect(parseResult).to.be.equal('124');
    });

    it('should omit arguments that are NaN', () => {
      const parseResult = TemplateParser(
        false,
        "{{add '1' '2' 'dolphins' '3'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('6');
    });
  });

  describe('Helper: subtract', () => {
    it('should subtract a number to another', () => {
      const parseResult = TemplateParser(
        false,
        '{{subtract 1 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should subtract the number described by a string to another number described by a string', () => {
      const parseResult = TemplateParser(
        false,
        "{{subtract '1' '1'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should return the base value when given a single parameter', () => {
      const parseResult = TemplateParser(
        false,
        '{{subtract 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser(
        false,
        '{{subtract }}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should subtract the body property to the initial value', () => {
      const parseResult = TemplateParser(
        false,
        "{{subtract 1 (body 'prop1')}}",
        {} as any,
        [],
        { body: { prop1: '123' } } as any
      );
      expect(parseResult).to.be.equal('-122');
    });

    it('should omit arguments that are NaN', () => {
      const parseResult = TemplateParser(
        false,
        "{{subtract '6' '2' 'dolphins' '3'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });
  });

  describe('Helper: multiply', () => {
    it('should multiply a number by another', () => {
      const parseResult = TemplateParser(
        false,
        '{{multiply 2 3}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('6');
    });

    it('should multiply the number described by a string by another number described by a string', () => {
      const parseResult = TemplateParser(
        false,
        "{{multiply '2' '3'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('6');
    });

    it('should return the base value when given a single parameter', () => {
      const parseResult = TemplateParser(
        false,
        '{{multiply 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser(
        false,
        '{{multiply }}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should multiply the body property by the initial value', () => {
      const parseResult = TemplateParser(
        false,
        "{{multiply 2 (body 'prop1')}}",
        {} as any,
        [],
        { body: { prop1: '123' } } as any
      );
      expect(parseResult).to.be.equal('246');
    });

    it('should omit arguments that are NaN', () => {
      const parseResult = TemplateParser(
        false,
        "{{multiply '1' '2' 'dolphins' '3'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('6');
    });
  });

  describe('Helper: divide', () => {
    it('should divide a number by another', () => {
      const parseResult = TemplateParser(
        false,
        '{{divide 4 2}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('2');
    });

    it('should divide the number described by a string by another number described by a string', () => {
      const parseResult = TemplateParser(
        false,
        "{{divide '6' '2'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('3');
    });

    it('should return the base value when given a single parameter', () => {
      const parseResult = TemplateParser(
        false,
        '{{divide 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser(
        false,
        '{{divide }}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should divide the initial value by the body property', () => {
      const parseResult = TemplateParser(
        false,
        "{{divide 246 (body 'prop1')}}",
        {} as any,
        [],
        { body: { prop1: '123' } } as any
      );
      expect(parseResult).to.be.equal('2');
    });

    it('should return an emtpy string when attempting to divide by 0', () => {
      const parseResult = TemplateParser(
        false,
        "{{divide 5 '0' 5}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should omit arguments that are NaN', () => {
      const parseResult = TemplateParser(
        false,
        "{{divide '6' '2' 'dolphins' '3'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });
  });

  describe('Helper: modulo', () => {
    it('should compute the modulo x of a number', () => {
      const parseResult = TemplateParser(
        false,
        '{{modulo 4 2}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should compute the modulo x (passed as a string) of a number described by a string', () => {
      const parseResult = TemplateParser(
        false,
        "{{modulo '4' '2'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should return an empty string when given a single parameter', () => {
      const parseResult = TemplateParser(
        false,
        '{{modulo 4}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser(
        false,
        '{{modulo }}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should compute the modulo of the initial value by the body property', () => {
      const parseResult = TemplateParser(
        false,
        "{{modulo 4 (body 'prop1')}}",
        {} as any,
        [],
        { body: { prop1: '2' } } as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should return an empty string when attempting to compute modulo 0', () => {
      const parseResult = TemplateParser(
        false,
        '{{modulo 4 0}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });
  });

  describe('Helper: ceil', () => {
    it('should ceil a number', () => {
      const parseResult = TemplateParser(
        false,
        '{{ceil 0.5}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should ceil a number described by a string', () => {
      const parseResult = TemplateParser(
        false,
        "{{ceil '0.5'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return the base value when given an integer', () => {
      const parseResult = TemplateParser(
        false,
        '{{ceil 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser(
        false,
        '{{ceil }}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });
  });

  describe('Helper: floor', () => {
    it('should floor a number', () => {
      const parseResult = TemplateParser(
        false,
        '{{floor 0.5}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should floor a number described by a string', () => {
      const parseResult = TemplateParser(
        false,
        "{{floor '0.5'}}",
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should return the base value when given an integer', () => {
      const parseResult = TemplateParser(
        false,
        '{{floor 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser(
        false,
        '{{floor }}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });
  });

  describe('Helper: round', () => {
    it('should round a number up when min .5', () => {
      const parseResult = TemplateParser(
        false,
        '{{round 0.5}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should round a number down when smaller than .5', () => {
      const parseResult = TemplateParser(
        false,
        '{{round 0.499}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should take a string', () => {
      const parseResult = TemplateParser(
        false,
        '{{round "0.499"}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should return empty string if no parameters', () => {
      const parseResult = TemplateParser(
        false,
        '{{round}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });
  });

  describe('Helper: toFixed', function () {
    it('should fix the number to correct format', () => {
      const parseResult = TemplateParser(
        false,
        '{{toFixed 1.11111 2}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('1.11');
    });

    it('should delete all decimal places if no fix value is given', () => {
      const parseResult = TemplateParser(
        false,
        '{{toFixed 2.11111}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('2');
    });

    it('should return 0 if no values are given', () => {
      const parseResult = TemplateParser(
        false,
        '{{toFixed}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should return 0 if wrong values are given as number', () => {
      const parseResult = TemplateParser(
        false,
        '{{toFixed "hi"}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });
  });

  describe('Helper: gt', function () {
    it('should return true if first number is bigger than second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{gt 1.11111 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return false if first number is smaller than second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{gt 1.11111 1.2}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });

    it('should return false if first number is equal to the second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{gt 1 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });
  });

  describe('Helper: gt', function () {
    it('should return true if first number is bigger than second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{gt 1.11111 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return false if first number is smaller than second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{gt 1.11111 1.2}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });

    it('should return false if first number is equal to the second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{gt 1 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });
  });

  describe('Helper: gte', function () {
    it('should return true if first number is bigger than second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{gte 1.11111 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return false if first number is smaller than second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{gte 1.11111 1.2}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });

    it('should return true if first number is equal to the second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{gte 1 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });
  });

  describe('Helper: lt', function () {
    it('should return true if second number is bigger than first number', () => {
      const parseResult = TemplateParser(
        false,
        '{{lt 1 2}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return false if second number is bigger than second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{lt 2 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });

    it('should return false if first number is equal to the second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{lt 1 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });
  });

  describe('Helper: lte', function () {
    it('should return true if second number is bigger than first number', () => {
      const parseResult = TemplateParser(
        false,
        '{{lte 1 2}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return false if second number is bigger than second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{lte 2 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });

    it('should return true if first number is equal to the second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{lte 1 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });
  });

  describe('Helper: eq', function () {
    it('should return false if second number is bigger than first number', () => {
      const parseResult = TemplateParser(
        false,
        '{{eq 1 2}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });

    it('should return false if second number is bigger than second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{eq 2 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });

    it('should return true if first number is equal to the second number', () => {
      const parseResult = TemplateParser(
        false,
        '{{eq 1 1}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return false if first number is number and second is string', () => {
      const parseResult = TemplateParser(
        false,
        '{{eq 1 "1"}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });

    it('should return true if first value is string equal to second string', () => {
      const parseResult = TemplateParser(
        false,
        '{{eq "v1" "v1"}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return false if first value is string and not equal to second string', () => {
      const parseResult = TemplateParser(
        false,
        '{{eq "v1" "v11"}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });
  });

  describe('Helper: stringify', () => {
    it('should output objects as string', () => {
      const parseResult = TemplateParser(
        false,
        '{{{stringify (bodyRaw "prop2")}}}',
        {} as any,
        [],
        {
          body: {
            prop1: '123',
            prop2: {
              data: 'super'
            }
          }
        } as any
      );
      expect(parseResult).to.be.equal(`{
  "data": "super"
}`);
    });
  });

  describe('Helper: padStart', () => {
    it('should return empty string if no param provided', () => {
      const parseResult = TemplateParser(
        false,
        '{{padStart}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return string as is if no length and no padchar', () => {
      const parseResult = TemplateParser(
        false,
        '{{padStart (bodyRaw "prop1")}}',
        {} as any,
        [],
        {
          body: {
            prop1: '123'
          }
        } as any
      );
      expect(parseResult).to.be.equal('123');
    });

    it('should return string padded with spaces if no padchar', () => {
      const parseResult = TemplateParser(
        false,
        '{{padStart (bodyRaw "prop1") 10}}',
        {} as any,
        [],
        {
          body: {
            prop1: '123'
          }
        } as any
      );
      expect(parseResult).to.be.equal('       123');
    });

    it('should return string padded with chosen char', () => {
      const parseResult = TemplateParser(
        false,
        '{{padStart (bodyRaw "prop1") 10 "*"}}',
        {} as any,
        [],
        {
          body: {
            prop1: '123'
          }
        } as any
      );
      expect(parseResult).to.be.equal('*******123');
    });
  });

  describe('Helper: padEnd', () => {
    it('should return empty string if no param provided', () => {
      const parseResult = TemplateParser(
        false,
        '{{padEnd}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return string as is if no length and no padchar', () => {
      const parseResult = TemplateParser(
        false,
        '{{padEnd (bodyRaw "prop1")}}',
        {} as any,
        [],
        {
          body: {
            prop1: '123'
          }
        } as any
      );
      expect(parseResult).to.be.equal('123');
    });

    it('should return string padded with spaces if no padchar', () => {
      const parseResult = TemplateParser(
        false,
        '{{padEnd (bodyRaw "prop1") 10}}',
        {} as any,
        [],
        {
          body: {
            prop1: '123'
          }
        } as any
      );
      expect(parseResult).to.be.equal('123       ');
    });

    it('should return string padded with chosen char', () => {
      const parseResult = TemplateParser(
        false,
        '{{padEnd (bodyRaw "prop1") 10 "*"}}',
        {} as any,
        [],
        {
          body: {
            prop1: '123'
          }
        } as any
      );
      expect(parseResult).to.be.equal('123*******');
    });
  });

  describe('Helper: oneOf', () => {
    it('should return empty string if no param provided', () => {
      const parseResult = TemplateParser(
        false,
        '{{oneOf}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return empty string if first param is not an array', () => {
      const parseResult = TemplateParser(
        false,
        '{{oneOf true}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should return a stringified object if choses from array of object and stringify is true', () => {
      const parseResult = TemplateParser(
        false,
        '{{oneOf (dataRaw "abc1") true}}',
        {} as any,
        [
          {
            id: 'abc1',
            name: 'db1',
            parsed: true,
            value: [{ id: 1, value: 'value1' }]
          }
        ],
        {} as any
      );
      expect(parseResult).to.be.equal('{"id":1,"value":"value1"}');
    });

    it('should return an [object Object] string if choses from array of object and stringify is false', () => {
      const parseResult = TemplateParser(
        false,
        '{{oneOf (dataRaw "abc1")}}',
        {} as any,
        [
          {
            id: 'abc1',
            name: 'db1',
            parsed: true,
            value: [{ id: 1, value: 'value1' }]
          }
        ],
        {} as any
      );
      expect(parseResult).to.be.equal('[object Object]');
    });
  });

  describe('Helper: object', () => {
    it('should return an empty object if empty object passed', () => {
      const parseResult = TemplateParser(
        false,
        '{{ stringify (object) }}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal('{}');
    });

    it('should return valid key=value object if key=value passed', () => {
      const parseResult = TemplateParser(
        false,
        '{{{ stringify (object key="value") }}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal(
        JSON.stringify({ key: 'value' }, null, 2)
      );
    });

    it('should return valid multiple keys object if multiple keys passed', () => {
      const parseResult = TemplateParser(
        false,
        '{{{ stringify (object key="value" secondKey="secondValue" numericKey=5) }}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal(
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

  describe('Helper: filter', () => {
    it('should return correctly filtered array with primitives OR condition', () => {
      const parseResult = TemplateParser(
        false,
        '{{ stringify (filter (array 1 2 3 4 true false) 3 1 true) }}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal(JSON.stringify([1, 3, true], null, 2));
    });

    it('should return correctly filtered array with mixed data OR condition', () => {
      const parseResult = TemplateParser(
        false,
        '{{{ stringify (filter (array (object key="value") 2 3) (object key="value") 3) }}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal(
        JSON.stringify([{ key: 'value' }, 3], null, 2)
      );
    });

    it('should return correctly filtered array with mixed AND condition', () => {
      const parseResult = TemplateParser(
        false,
        '{{{ stringify (filter (array (object a="a1" b="b2") (object a="a1" b="b1") 2 3) (object a="a1" b="b1") 3) }}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal(
        JSON.stringify([{ b: 'b1', a: 'a1' }, 3], null, 2)
      );
    });

    it('should return correctly return array filtered by nested values', () => {
      const parseResult = TemplateParser(
        false,
        '{{{ stringify (filter (array (object parent=(object child="child-val") b="b1") (object parent=(object child="child-val2") b="b2") 2 3) (object parent=(object child="child-val"))) }}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal(
        JSON.stringify([{ b: 'b1', parent: { child: 'child-val' } }], null, 2)
      );
    });

    it('should return correctly return array filtered array when nested value not equals', () => {
      const parseResult = TemplateParser(
        false,
        '{{{ stringify (filter (array (object parent=(object child="child-val") b="b1") (object parent=(object child="child-val2") b="b2") 2 3) (object parent="parent-val")) }}}',
        {} as any,
        [],
        {} as any
      );
      expect(parseResult).to.be.equal(JSON.stringify([], null, 2));
    });
  });
});
