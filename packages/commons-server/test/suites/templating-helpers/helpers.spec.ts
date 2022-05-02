import { expect } from 'chai';
import { format as dateFormat } from 'date-fns';
import { TemplateParser } from '../../../src/libs/template-parser';

describe('Template parser', () => {
  describe('Helper: switch', () => {
    it('should return different values depending on the string value', () => {
      const parseResult = TemplateParser(
        '{{#switch (body "prop1")}}{{#case "value1"}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        {
          body: { prop1: 'value1' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('value1');
    });

    it('should return default values depending on the string value', () => {
      const parseResult = TemplateParser(
        '{{#switch (body "prop1")}}{{#case "value1"}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        {
          body: { prop1: 'defaultvalue' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('defaultvalue');
    });

    it('should return different values depending on the index', () => {
      const parseResult = TemplateParser(
        '{{#repeat 2 comma=false}}{{@index}}{{#switch @index}}{{#case 0}}John{{/case}}{{#default}}Peter{{/default}}{{/switch}}{{/repeat}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('0John1Peter');
    });

    it('should return different values depending on the boolean value', () => {
      const parseResult = TemplateParser(
        '{{#switch (bodyRaw "prop1")}}{{#case true}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        {
          body: { prop1: true }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('value1');
    });

    it('should return different values depending on the boolean value', () => {
      const parseResult = TemplateParser(
        '{{#switch (bodyRaw "prop1")}}{{#case true}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        {
          body: { prop1: false }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('defaultvalue');
    });
  });

  describe('Helper: concat', () => {
    it('should concat two strings', () => {
      const parseResult = TemplateParser(
        "{{concat 'test' 'test'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('testtest');
    });

    it('should concat two strings and repeat index', () => {
      const parseResult = TemplateParser(
        "{{#repeat 1 comma=false}}{{concat 'test' @index 'test'}}{{/repeat}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('test0test');
    });

    it('should concat two strings and the result of a helper', () => {
      const parseResult = TemplateParser(
        "{{#repeat 1 comma=false}}{{concat 'test' (body 'id') 'test'}}{{/repeat}}",
        { body: { id: '123' } } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('test123test');
    });

    it('should concat two strings and number', () => {
      const parseResult = TemplateParser(
        "{{concat 'test' 123 'test'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('test123test');
    });

    it('should concat object path to retrieve body array items', () => {
      const parseResult = TemplateParser(
        "{{#repeat 2 comma=false}}item_{{body (concat 'a.' @index '.item')}}{{/repeat}}",
        { body: { a: [{ item: 10 }, { item: 20 }] } } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('item_10item_20');
    });
  });

  describe('Helper: setVar', () => {
    it('should set a variable to a string', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' 'testvalue'}}{{testvar}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('testvalue');
    });

    it('should set a variable to a number', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' 123}}{{testvar}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('123');
    });

    it('should set a variable value to body helper result', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' (body 'uuid')}}{{testvar}}",
        {
          body: { uuid: '0d35618e-5e85-4c09-864d-6d63973271c8' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('0d35618e-5e85-4c09-864d-6d63973271c8');
    });

    it('should set a variable value to oneOf helper result', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' (oneOf (array 'item1'))}}{{testvar}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('item1');
    });

    it('should set a variable and use it in another helper', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' 5}}{{#repeat testvar comma=false}}test{{/repeat}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('testtesttesttesttest');
    });

    it('should set a variable in a different scope: repeat', () => {
      const parseResult = TemplateParser(
        "{{#repeat 5 comma=false}}{{setVar 'testvar' @index}}{{@testvar}}{{/repeat}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('01234');
    });

    it('should set a variable in root scope and child scope: repeat', () => {
      const parseResult = TemplateParser(
        "{{setVar 'outsidevar' 'test'}}{{@root.outsidevar}}{{#repeat 5 comma=false}}{{setVar 'testvar' @index}}{{@testvar}}{{outsidevar}}{{/repeat}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('test0test1test2test3test4test');
    });

    it('should set a variable to empty value if none provided', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar'}}{{testvar}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });

    it('should not set a variable if no name provided', () => {
      const parseResult = TemplateParser(
        "{{setVar ''}}{{testvar}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });
  });

  describe('Helper: dateTimeShift', () => {
    it('Should not throw an error when passed with invalid parameters.', () => {
      const parseResult = TemplateParser(
        '{{dateTimeShift 1}}',
        {} as any,
        {} as any
      );

      // When invalid parameters are passed, the default should just be to return the current date with no shift.
      const date = new Date();
      const dateString = dateFormat(date, "yyyy-MM-dd'T'HH:mm");
      expect(parseResult).to.match(new RegExp(dateString + '.*'));
    });

    it('Should return a date shifted the specified amount of days from now.', () => {
      const parseResult = TemplateParser(
        '{{dateTimeShift days=2}}',
        {} as any,
        {} as any
      );

      const date = new Date();
      date.setDate(date.getDate() + 2);
      // As our reference date here may differ slightly from the one interally used in the helper, it's more reliable to just compare the date/time with the seconds (and lower) excluded.
      const dateString = dateFormat(date, "yyyy-MM-dd'T'HH:mm");
      expect(parseResult).to.match(new RegExp(dateString + '.*'));
    });

    it('Should return a date shifted by the requested amount from a specified start date.', () => {
      const parseResult = TemplateParser(
        "{{dateTimeShift date='2021-02-01' days=2 months=4}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.match(/2021-06-03.*/);
    });

    it('Should return a date shifted by the requested amount from the specified start date in the specified format.', () => {
      const parseResult = TemplateParser(
        "{{dateTimeShift date='2021-02-01' format='yyyy-MM-dd' days=2 months=4}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.equals('2021-06-03');
    });

    it('Should return a date time shifted by the requested amount from the specified start date in the specified format.', () => {
      const parseResult = TemplateParser(
        "{{dateTimeShift date='2021-02-01T10:45:00' format=\"yyyy-MM-dd'T'HH:mm:ss\" days=8 months=3 hours=1 minutes=2 seconds=3}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.equals('2021-05-09T11:47:03');
    });

    it('Should return a date time shifted by the requested amount when another helper is used as the date source (safestring).', () => {
      const parseResult = TemplateParser(
        "{{dateTimeShift date=(queryParam 'date') format=\"yyyy-MM-dd'T'HH:mm:ss\" hours=1}}",
        { query: { date: '2021-01-01 05:00:00' } } as any,
        {} as any
      );

      expect(parseResult).to.equals('2021-01-01T06:00:00');
    });

    it('Should return a date time shifted by the requested amount when another helper is used as the date and months and days source (safestring).', () => {
      const parseResult = TemplateParser(
        "{{dateTimeShift date=(queryParam 'date') format=\"yyyy-MM-dd\" days=(queryParam 'days') months=(queryParam 'months')}}",
        { query: { date: '2021-01-01', months: 1, days: 1 } } as any,
        {} as any
      );

      expect(parseResult).to.equals('2021-02-02');
    });
  });

  describe('Helper: includes', () => {
    it('should return true if a string includes a search string', () => {
      const parseResult = TemplateParser(
        "{{includes 'testdata' 'test'}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('true');
    });

    it('should return false if a string does not include a search string', () => {
      const parseResult = TemplateParser(
        "{{includes 'testdata' 'not'}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('false');
    });

    it('should not fail when passing no parameters', () => {
      const parseResult = TemplateParser('{{includes}}', {} as any, {} as any);

      expect(parseResult).to.be.equal('true');
    });

    it('should not fail when passing only one parameter', () => {
      const parseResult = TemplateParser(
        "{{includes 'testdata'}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('true');
    });
  });

  describe('Helper: substr', () => {
    it('should return a substring of the provided string', () => {
      const parseResult = TemplateParser(
        "{{substr 'testdata' 4 4}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should work correctly when from and length parameters are passed as strings', () => {
      const parseResult = TemplateParser(
        "{{substr 'testdata' '4' '4'}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should return a substring of the provided string to the end when the length parameter is excluded (from as a number)', () => {
      const parseResult = TemplateParser(
        "{{substr 'testdata' 4}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should return a substring of the provided string to the end when the length parameter is excluded (from as a string)', () => {
      const parseResult = TemplateParser(
        "{{substr 'testdata' '4'}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('Should work correctly when variables are passed as parameters as numbers', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' 'testdata'}}{{setVar 'from' 4}}{{setVar 'length' 4}}{{substr testvar from length}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('Should work correctly when variables are passed as parameters as strings', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' 'testdata'}}{{setVar 'from' '4'}}{{setVar 'length' '4'}}{{substr testvar from length}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('Should work correctly when other helpers are used for parameters as numbers', () => {
      const parseResult = TemplateParser(
        "{{substr (body 'prop1') (body 'prop2') (body 'prop3')}}",
        {
          body: { prop1: 'testdata', prop2: 4, prop3: 4 }
        } as any,
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('Should work correctly when other helpers are used for parameters as strings', () => {
      const parseResult = TemplateParser(
        "{{substr (body 'prop1') (body 'prop2') (body 'prop3')}}",
        {
          body: { prop1: 'testdata', prop2: '4', prop3: '4' }
        } as any,
        {} as any
      );

      expect(parseResult).to.be.equal('data');
    });

    it('should not fail when passing no parameters', () => {
      const parseResult = TemplateParser('{{substr}}', {} as any, {} as any);

      expect(parseResult).to.be.equal('');
    });

    it('should not fail when passing only one parameter', () => {
      const parseResult = TemplateParser(
        "{{substr 'testdata'}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('testdata');
    });
  });

  describe('Helper: split', () => {
    it('should split a string using spaces as separator', () => {
      const parseResult = TemplateParser(
        '{{split "I love dolphins" " "}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('I,love,dolphins');
    });

    it('should split a string using commas', () => {
      const parseResult = TemplateParser(
        '{{split "I too, love dolphins" ","}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('I too, love dolphins');
    });

    it('should split a string using spaces by default', () => {
      const parseResult = TemplateParser(
        '{{split "I love dolphins"}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('I,love,dolphins');
    });

    it('should split a string using spaces when given anything else but a string as separator', () => {
      const parseResult = TemplateParser(
        '{{split "I love dolphins" 123}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('I,love,dolphins');
    });

    it('should return an empty string when given anything else but a string as data', () => {
      const parseResult = TemplateParser(
        '{{split 123 ","}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('');
    });

    it('should be usable within a #each', () => {
      const parseResult = TemplateParser(
        '{{#each (split "1 2 3" " ")}}dolphin,{{/each}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('dolphin,dolphin,dolphin,');
    });

    it('should be compatible with SafeString (queryParam)', () => {
      const parseResult = TemplateParser(
        "{{#each (split (queryParam 'param1') ',')}}item{{this}},{{/each}}",
        { query: { param1: '123,456,789' } } as any,
        {} as any
      );

      expect(parseResult).to.be.equal('item123,item456,item789,');
    });
  });

  describe('Helper: lowercase', () => {
    it('should return nothing when no parameter is passed', () => {
      const parseResult = TemplateParser('{{lowercase}}', {} as any, {} as any);

      expect(parseResult).to.be.equal('');
    });

    it('should lowercase a string', () => {
      const parseResult = TemplateParser(
        '{{lowercase "ABCD"}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('abcd');
    });

    it('should be usable within a #switch', () => {
      const parseResult = TemplateParser(
        '{{#switch (lowercase "ABCD")}}{{#case "abcd"}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('value1');
    });

    it('should be compatible with SafeString (queryParam)', () => {
      const parseResult = TemplateParser(
        "{{lowercase (queryParam 'param1')}}",
        { query: { param1: 'ABCD' } } as any,
        {} as any
      );

      expect(parseResult).to.be.equal('abcd');
    });
  });

  describe('Helper: uppercase', () => {
    it('should return nothing when no parameter is passed', () => {
      const parseResult = TemplateParser('{{uppercase}}', {} as any, {} as any);

      expect(parseResult).to.be.equal('');
    });

    it('should uppercase a string', () => {
      const parseResult = TemplateParser(
        '{{uppercase "abcd"}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('ABCD');
    });

    it('should be usable within a #switch', () => {
      const parseResult = TemplateParser(
        '{{#switch (uppercase "abcd")}}{{#case "ABCD"}}value1{{/case}}{{#default}}defaultvalue{{/default}}{{/switch}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('value1');
    });

    it('should be compatible with SafeString (queryParam)', () => {
      const parseResult = TemplateParser(
        "{{uppercase (queryParam 'param1')}}",
        { query: { param1: 'abcd' } } as any,
        {} as any
      );

      expect(parseResult).to.be.equal('ABCD');
    });
  });

  describe('Helper: join', () => {
    it('should join an Array with spaces', () => {
      const parseResult = TemplateParser(
        '{{join (array "Mockoon" "is" "nice") " "}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('Mockoon is nice');
    });

    it('should ignore non Array values and return same value', () => {
      const parseResult = TemplateParser(
        '{{join "I too, love dolphins" " "}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('I too, love dolphins');
    });

    it('should use comma separator if no separator was provided', () => {
      const parseResult = TemplateParser(
        '{{join (array "Water" "Tea" "Coffee")}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('Water, Tea, Coffee');
    });
  });

  describe('Helper: slice', () => {
    it('should return an empty string if parameter is not an array', () => {
      const parseResult = TemplateParser(
        '{{slice "hello"}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('');
    });

    it('should return the stringified array (same content)', () => {
      const parseResult = TemplateParser(
        '{{slice (array "Mockoon" "is" "very" "nice")}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('Mockoon,is,very,nice');
    });

    it('should return the stringified first two elements', () => {
      const parseResult = TemplateParser(
        '{{slice (array "Mockoon" "is" "very" "nice") 0 2}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('Mockoon,is');
    });

    it('should return the stringified last two elements', () => {
      const parseResult = TemplateParser(
        '{{slice (array "Mockoon" "is" "very" "nice") 2}}',
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('very,nice');
    });
  });

  describe('Helper: indexOf', () => {
    it('should return the index of a matching substring', () => {
      const parseResult = TemplateParser(
        "{{indexOf 'testdata' 'data'}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('4');
    });

    it('should return the index of a matching substring from a given starting position', () => {
      const parseResult = TemplateParser(
        "{{indexOf 'testdatadata' 'data' 6}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('8');
    });

    it('should still work correctly if the position parameter is passed as a string', () => {
      const parseResult = TemplateParser(
        "{{indexOf 'testdatadata' 'data' '6'}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('8');
    });

    it('should be possible to search for a number', () => {
      const parseResult = TemplateParser(
        "{{indexOf 'testdata12345' 3}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('10');
    });

    it('should be possible to search for a number (as a string)', () => {
      const parseResult = TemplateParser(
        "{{indexOf 'testdata12345' '3'}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('10');
    });

    it('Can return the index from a previously set variable', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' 'this is a test'}}{{indexOf testvar 'test'}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('10');
    });

    it('Can return the index from a previously set variable using a variable for the search string', () => {
      const parseResult = TemplateParser(
        "{{setVar 'testvar' 'this is a test'}}{{setVar 'searchstring' 'test'}}{{indexOf testvar searchstring}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('10');
    });

    it('Can return the index from a body property', () => {
      const parseResult = TemplateParser(
        "{{indexOf (body 'prop1') (body 'prop2')}}",
        {
          body: { prop1: 'First test then test', prop2: 'test' }
        } as any,
        {} as any
      );

      expect(parseResult).to.be.equal('6');
    });

    it('Can return the index from a body property with a position', () => {
      const parseResult = TemplateParser(
        "{{indexOf (body 'prop1') (body 'prop2') (body 'prop3')}}",
        {
          body: {
            prop1: 'First test then test',
            prop2: 'test',
            prop3: 10
          }
        } as any,
        {} as any
      );

      expect(parseResult).to.be.equal('16');
    });

    it('should not fail when passing no parameters', () => {
      const parseResult = TemplateParser('{{indexOf}}', {} as any, {} as any);

      expect(parseResult).to.be.equal('0');
    });

    it('should not fail when passing only one parameter', () => {
      const parseResult = TemplateParser(
        "{{indexOf 'testdata'}}",
        {} as any,
        {} as any
      );

      expect(parseResult).to.be.equal('0');
    });
  });

  describe('Helper: someOf', () => {
    it('should return one element', () => {
      const parseResult = TemplateParser(
        "{{someOf (array 'value1' 'value2' 'value3' 'value4' 'value5' 'value6') 1 1}}",
        {} as any,
        {} as any
      );

      const count = (parseResult.match(/value/g) || []).length;
      expect(count).to.equal(1);
    });

    it('should return 1 to 3 elements', () => {
      const parseResult = TemplateParser(
        "{{someOf (array 'value1' 'value2' 'value3' 'value4' 'value5' 'value6') 1 3}}",
        {} as any,
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
        "{{someOf (array 'value1' 'value2' 'value3' 'value4' 'value5' 'value6') 1 3 true}}",
        {} as any,
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
        '{{len (array 1 2 3)}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('3');
    });

    it('should return the length of a string', () => {
      const parseResult = TemplateParser(
        '{{len "Cowboy"}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('6');
    });

    it('should return 0 if value is not an array', () => {
      const parseResult = TemplateParser('{{len true}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('0');
    });

    it('should return 0 if no value was provided', () => {
      const parseResult = TemplateParser('{{len}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('0');
    });
  });

  describe('Helper: base64', () => {
    it('should encode string to base64', () => {
      const parseResult = TemplateParser(
        "{{base64 'abc'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('YWJj');
    });

    it('should encode body property to base64', () => {
      const parseResult = TemplateParser(
        "{{base64 (body 'prop1')}}",
        {
          body: { prop1: '123' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('MTIz');
    });

    it('should encode block to base64', () => {
      const parseResult = TemplateParser(
        "{{#base64}}value: {{body 'prop1'}}{{/base64}}",
        {
          body: { prop1: '123' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('dmFsdWU6IDEyMw==');
    });
  });

  describe('Helper: base64', () => {
    it('should decode a string from base64', () => {
      const parseResult = TemplateParser(
        "{{base64Decode 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkw'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('abcdefghijklmnopqrstuvwxyz1234567890');
    });

    it('should decode body property from base64', () => {
      const parseResult = TemplateParser(
        "{{base64Decode (body 'prop1')}}",
        {
          body: { prop1: 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY3ODkw' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('abcdefghijklmnopqrstuvwxyz1234567890');
    });

    it('should decode block from base64', () => {
      const parseResult = TemplateParser(
        "{{#base64Decode}}YWJjZGVmZ2hpamtsbW5vcHF{{body 'prop1'}}{{/base64Decode}}",
        {
          body: { prop1: 'yc3R1dnd4eXoxMjM0NTY3ODkw' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('abcdefghijklmnopqrstuvwxyz1234567890');
    });
  });

  describe('Helper: add', () => {
    it('should add a number to another', () => {
      const parseResult = TemplateParser('{{add 1 1}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('2');
    });

    it('should add the number described by a string to another number described by a string', () => {
      const parseResult = TemplateParser(
        "{{add '1' '1'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('2');
    });

    it('should return the base value when given a single parameter', () => {
      const parseResult = TemplateParser('{{add 1}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser('{{add }}', {} as any, {} as any);
      expect(parseResult).to.be.equal('');
    });

    it('should add the body property to the initial value', () => {
      const parseResult = TemplateParser(
        "{{add 1 (body 'prop1')}}",
        {
          body: { prop1: '123' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('124');
    });

    it('should omit arguments that are NaN', () => {
      const parseResult = TemplateParser(
        "{{add '1' '2' 'dolphins' '3'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('6');
    });
  });

  describe('Helper: subtract', () => {
    it('should subtract a number to another', () => {
      const parseResult = TemplateParser(
        '{{subtract 1 1}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should subtract the number described by a string to another number described by a string', () => {
      const parseResult = TemplateParser(
        "{{subtract '1' '1'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should return the base value when given a single parameter', () => {
      const parseResult = TemplateParser(
        '{{subtract 1}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser('{{subtract }}', {} as any, {} as any);
      expect(parseResult).to.be.equal('');
    });

    it('should subtract the body property to the initial value', () => {
      const parseResult = TemplateParser(
        "{{subtract 1 (body 'prop1')}}",
        {
          body: { prop1: '123' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('-122');
    });

    it('should omit arguments that are NaN', () => {
      const parseResult = TemplateParser(
        "{{subtract '6' '2' 'dolphins' '3'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });
  });

  describe('Helper: multiply', () => {
    it('should multiply a number by another', () => {
      const parseResult = TemplateParser(
        '{{multiply 2 3}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('6');
    });

    it('should multiply the number described by a string by another number described by a string', () => {
      const parseResult = TemplateParser(
        "{{multiply '2' '3'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('6');
    });

    it('should return the base value when given a single parameter', () => {
      const parseResult = TemplateParser(
        '{{multiply 1}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser('{{multiply }}', {} as any, {} as any);
      expect(parseResult).to.be.equal('');
    });

    it('should multiply the body property by the initial value', () => {
      const parseResult = TemplateParser(
        "{{multiply 2 (body 'prop1')}}",
        {
          body: { prop1: '123' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('246');
    });

    it('should omit arguments that are NaN', () => {
      const parseResult = TemplateParser(
        "{{multiply '1' '2' 'dolphins' '3'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('6');
    });
  });

  describe('Helper: divide', () => {
    it('should divide a number by another', () => {
      const parseResult = TemplateParser(
        '{{divide 4 2}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('2');
    });

    it('should divide the number described by a string by another number described by a string', () => {
      const parseResult = TemplateParser(
        "{{divide '6' '2'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('3');
    });

    it('should return the base value when given a single parameter', () => {
      const parseResult = TemplateParser('{{divide 1}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser('{{divide }}', {} as any, {} as any);
      expect(parseResult).to.be.equal('');
    });

    it('should divide the initial value by the body property', () => {
      const parseResult = TemplateParser(
        "{{divide 246 (body 'prop1')}}",
        {
          body: { prop1: '123' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('2');
    });

    it('should return an emtpy string when attempting to divide by 0', () => {
      const parseResult = TemplateParser(
        "{{divide 5 '0' 5}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should omit arguments that are NaN', () => {
      const parseResult = TemplateParser(
        "{{divide '6' '2' 'dolphins' '3'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });
  });

  describe('Helper: modulo', () => {
    it('should compute the modulo x of a number', () => {
      const parseResult = TemplateParser(
        '{{modulo 4 2}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should compute the modulo x (passed as a string) of a number described by a string', () => {
      const parseResult = TemplateParser(
        "{{modulo '4' '2'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should return an empty string when given a single parameter', () => {
      const parseResult = TemplateParser('{{modulo 4}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser('{{modulo }}', {} as any, {} as any);
      expect(parseResult).to.be.equal('');
    });

    it('should compute the modulo of the initial value by the body property', () => {
      const parseResult = TemplateParser(
        "{{modulo 4 (body 'prop1')}}",
        {
          body: { prop1: '2' }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should return an empty string when attempting to compute modulo 0', () => {
      const parseResult = TemplateParser(
        '{{modulo 4 0}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('');
    });
  });

  describe('Helper: ceil', () => {
    it('should ceil a number', () => {
      const parseResult = TemplateParser('{{ceil 0.5}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('1');
    });

    it('should ceil a number described by a string', () => {
      const parseResult = TemplateParser(
        "{{ceil '0.5'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('1');
    });

    it('should return the base value when given an integer', () => {
      const parseResult = TemplateParser('{{ceil 1}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser('{{ceil }}', {} as any, {} as any);
      expect(parseResult).to.be.equal('');
    });
  });

  describe('Helper: floor', () => {
    it('should floor a number', () => {
      const parseResult = TemplateParser('{{floor 0.5}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('0');
    });

    it('should floor a number described by a string', () => {
      const parseResult = TemplateParser(
        "{{floor '0.5'}}",
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should return the base value when given an integer', () => {
      const parseResult = TemplateParser('{{floor 1}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('1');
    });

    it('should return an empty string when given no arguments', () => {
      const parseResult = TemplateParser('{{floor }}', {} as any, {} as any);
      expect(parseResult).to.be.equal('');
    });
  });

  describe('Helper: round', () => {
    it('should round a number up when min .5', () => {
      const parseResult = TemplateParser('{{round 0.5}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('1');
    });

    it('should round a number down when smaller than .5', () => {
      const parseResult = TemplateParser(
        '{{round 0.499}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should take a string', () => {
      const parseResult = TemplateParser(
        '{{round "0.499"}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });

    it('should return empty string if no parameters', () => {
      const parseResult = TemplateParser('{{round}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('');
    });
  });

  describe('Helper: toFixed', function () {
    it('should fix the number to correct format', () => {
      const parseResult = TemplateParser(
        '{{toFixed 1.11111 2}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('1.11');
    });

    it('should delete all decimal places if no fix value is given', () => {
      const parseResult = TemplateParser(
        '{{toFixed 2.11111}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('2');
    });

    it('should return 0 if no values are given', () => {
      const parseResult = TemplateParser('{{toFixed}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('0');
    });

    it('should return 0 if wrong values are given as number', () => {
      const parseResult = TemplateParser(
        '{{toFixed "hi"}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('0');
    });
  });

  describe('Helper: gt', function () {
    it('should return true if first number is bigger than second number', () => {
      const parseResult = TemplateParser(
        '{{gt 1.11111 1}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return false if first number is smaller than second number', () => {
      const parseResult = TemplateParser(
        '{{gt 1.11111 1.2}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });

    it('should return false if first number is equal to the second number', () => {
      const parseResult = TemplateParser('{{gt 1 1}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('false');
    });
  });

  describe('Helper: gt', function () {
    it('should return true if first number is bigger than second number', () => {
      const parseResult = TemplateParser(
        '{{gt 1.11111 1}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return false if first number is smaller than second number', () => {
      const parseResult = TemplateParser(
        '{{gt 1.11111 1.2}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });

    it('should return false if first number is equal to the second number', () => {
      const parseResult = TemplateParser('{{gt 1 1}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('false');
    });
  });

  describe('Helper: gte', function () {
    it('should return true if first number is bigger than second number', () => {
      const parseResult = TemplateParser(
        '{{gte 1.11111 1}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('true');
    });

    it('should return false if first number is smaller than second number', () => {
      const parseResult = TemplateParser(
        '{{gte 1.11111 1.2}}',
        {} as any,
        {} as any
      );
      expect(parseResult).to.be.equal('false');
    });

    it('should return true if first number is equal to the second number', () => {
      const parseResult = TemplateParser('{{gte 1 1}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('true');
    });
  });

  describe('Helper: lt', function () {
    it('should return true if second number is bigger than first number', () => {
      const parseResult = TemplateParser('{{lt 1 2}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('true');
    });

    it('should return false if second number is bigger than second number', () => {
      const parseResult = TemplateParser('{{lt 2 1}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('false');
    });

    it('should return false if first number is equal to the second number', () => {
      const parseResult = TemplateParser('{{lt 1 1}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('false');
    });
  });

  describe('Helper: lte', function () {
    it('should return true if second number is bigger than first number', () => {
      const parseResult = TemplateParser('{{lte 1 2}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('true');
    });

    it('should return false if second number is bigger than second number', () => {
      const parseResult = TemplateParser('{{lte 2 1}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('false');
    });

    it('should return true if first number is equal to the second number', () => {
      const parseResult = TemplateParser('{{lte 1 1}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('true');
    });
  });

  describe('Helper: eq', function () {
    it('should return false if second number is bigger than first number', () => {
      const parseResult = TemplateParser('{{eq 1 2}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('false');
    });

    it('should return false if second number is bigger than second number', () => {
      const parseResult = TemplateParser('{{eq 2 1}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('false');
    });

    it('should return true if first number is equal to the second number', () => {
      const parseResult = TemplateParser('{{eq 1 1}}', {} as any, {} as any);
      expect(parseResult).to.be.equal('true');
    });
  });

  describe('Helper: stringify', () => {
    it('should output objects as string', () => {
      const parseResult = TemplateParser(
        '{{{stringify (bodyRaw "prop2")}}}',
        {
          body: {
            prop1: '123',
            prop2: {
              data: 'super'
            }
          }
        } as any,
        {} as any
      );
      expect(parseResult).to.be.equal(`{
  "data": "super"
}`);
    });
  });
});
