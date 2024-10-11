import { deepStrictEqual, strictEqual } from 'assert';
import {
  FILTERS,
  FilterData,
  applyFilter,
  parseFilters
} from '../../src/libs/filters';

describe('Filters', () => {
  describe('parseFilters', () => {
    it('should parse the "eq" filter', () => {
      const queryParams = { name_eq: 'peter' };
      const expected: FilterData[] = [
        { path: 'name', filter: 'eq', value: 'peter' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should parse the "ne" filter', () => {
      const queryParams = { name_ne: 'peter' };
      const expected: FilterData[] = [
        { path: 'name', filter: 'ne', value: 'peter' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should parse the "gt" filter', () => {
      const queryParams = { age_gt: '18' };
      const expected: FilterData[] = [
        { path: 'age', filter: 'gt', value: '18' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should parse the "gte" filter', () => {
      const queryParams = { age_gte: '18' };
      const expected: FilterData[] = [
        { path: 'age', filter: 'gte', value: '18' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should parse the "lt" filter', () => {
      const queryParams = { age_lt: '18' };
      const expected: FilterData[] = [
        { path: 'age', filter: 'lt', value: '18' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should parse the "lte" filter', () => {
      const queryParams = { age_lte: '18' };
      const expected: FilterData[] = [
        { path: 'age', filter: 'lte', value: '18' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should parse the "like" filter', () => {
      const queryParams = { name_like: 'peter' };
      const expected: FilterData[] = [
        { path: 'name', filter: 'like', value: 'peter' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should parse the "start" filter', () => {
      const queryParams = { name_start: 'peter' };
      const expected: FilterData[] = [
        { path: 'name', filter: 'start', value: 'peter' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should parse the "end" filter', () => {
      const queryParams = { name_end: 'peter' };
      const expected: FilterData[] = [
        { path: 'name', filter: 'end', value: 'peter' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should parse multiple filters', () => {
      const queryParams = {
        name_eq: 'peter',
        age_gt: '18',
        age_lt: '30'
      };
      const expected: FilterData[] = [
        { path: 'name', filter: 'eq', value: 'peter' },
        { path: 'age', filter: 'gt', value: '18' },
        { path: 'age', filter: 'lt', value: '30' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should ignore invalid filters', () => {
      const queryParams = {
        name_eq: 'peter',
        age_gt: '18',
        age_lt: '30',
        invalid: 'filter'
      };
      const expected: FilterData[] = [
        { path: 'name', filter: 'eq', value: 'peter' },
        { path: 'age', filter: 'gt', value: '18' },
        { path: 'age', filter: 'lt', value: '30' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should accept nested paths', () => {
      const queryParams = { 'user.name_eq': 'peter' };
      const expected: FilterData[] = [
        { path: 'user.name', filter: 'eq', value: 'peter' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should accept nested paths (array)', () => {
      const queryParams = { 'users.0.name_eq': 'peter' };
      const expected: FilterData[] = [
        { path: 'users.0.name', filter: 'eq', value: 'peter' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should accept paths with underscores', () => {
      const queryParams = { user_name_eq: 'peter' };
      const expected: FilterData[] = [
        { path: 'user_name', filter: 'eq', value: 'peter' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should accept paths with underscores containing a filter name', () => {
      const queryParams = { user_like_like: 'peter' };
      const expected: FilterData[] = [
        { path: 'user_like', filter: 'like', value: 'peter' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should accept more complex object-path notation', () => {
      const queryParams = { 'user.0.name_eq': 'peter' };
      const expected: FilterData[] = [
        { path: 'user.0.name', filter: 'eq', value: 'peter' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });

    it('should accept filters with empty path', () => {
      const queryParams = { _eq: 'peter' };
      const expected: FilterData[] = [
        { path: '', filter: 'eq', value: 'peter' }
      ];

      deepStrictEqual(parseFilters(queryParams), expected);
    });
  });

  describe('applyFilter', () => {
    it('should apply the "eq" filter', () => {
      const data = { name: 'peter' };
      const filterData: FilterData = {
        path: 'name',
        filter: 'eq',
        value: 'peter'
      };

      strictEqual(applyFilter(data, filterData), true);
    });

    it('should apply the "ne" filter', () => {
      const data = { name: 'peter' };
      const filterData: FilterData = {
        path: 'name',
        filter: 'ne',
        value: 'john'
      };

      strictEqual(applyFilter(data, filterData), true);
    });

    it('should apply the "gt" filter', () => {
      const data = { age: 20 };
      const filterData: FilterData = {
        path: 'age',
        filter: 'gt',
        value: '18'
      };

      strictEqual(applyFilter(data, filterData), true);
    });

    it('should apply the "gte" filter', () => {
      const data = { age: 20 };
      const filterData: FilterData = {
        path: 'age',
        filter: 'gte',
        value: '18'
      };

      strictEqual(applyFilter(data, filterData), true);
    });

    it('should apply the "lt" filter', () => {
      const data = { age: 20 };
      const filterData: FilterData = {
        path: 'age',
        filter: 'lt',
        value: '30'
      };

      strictEqual(applyFilter(data, filterData), true);
    });

    it('should apply the "lte" filter', () => {
      const data = { age: 20 };
      const filterData: FilterData = {
        path: 'age',
        filter: 'lte',
        value: '30'
      };

      strictEqual(applyFilter(data, filterData), true);
    });

    it('should apply the "like" filter', () => {
      const data = { name: 'peter' };
      const filterData: FilterData = {
        path: 'name',
        filter: 'like',
        value: 'et'
      };

      strictEqual(applyFilter(data, filterData), true);
    });

    it('should apply the "start" filter', () => {
      const data = { name: 'peter' };
      const filterData: FilterData = {
        path: 'name',
        filter: 'start',
        value: 'p'
      };

      strictEqual(applyFilter(data, filterData), true);
    });

    it('should apply the "end" filter', () => {
      const data = { name: 'peter' };
      const filterData: FilterData = {
        path: 'name',
        filter: 'end',
        value: 'r'
      };

      strictEqual(applyFilter(data, filterData), true);
    });

    it('should accept nested paths', () => {
      const data = { user: { name: 'peter' } };
      const filterData: FilterData = {
        path: 'user.name',
        filter: 'eq',
        value: 'peter'
      };

      strictEqual(applyFilter(data, filterData), true);
    });

    it('should accept nested paths (array)', () => {
      const data = { users: [{ name: 'peter' }] };
      const filterData: FilterData = {
        path: 'users.0.name',
        filter: 'eq',
        value: 'peter'
      };

      strictEqual(applyFilter(data, filterData), true);
    });

    it('should filter non-object values', () => {
      const data = 'peter';
      const filterData: FilterData = {
        path: '',
        filter: 'eq',
        value: 'peter'
      };

      strictEqual(applyFilter(data, filterData), true);
    });

    it('should not filter object values if path is empty', () => {
      const data = { name: 'peter' };
      const filterData: FilterData = {
        path: '',
        filter: 'eq',
        value: 'peter'
      };

      strictEqual(applyFilter(data, filterData), false);
    });
  });

  describe('FILTERS', () => {
    describe('eq', () => {
      it('should return true if the data is equal to the query', () => {
        strictEqual(FILTERS.eq('peter', 'peter'), true);
      });

      it('should return true if the data is equal to the query (number)', () => {
        strictEqual(FILTERS.eq(18, '18'), true);
      });

      it('should return true if the data is equal to the query (number, more complex)', () => {
        strictEqual(FILTERS.eq(18, '+18.00'), true);
      });

      it('should return false if the data is different from the query', () => {
        strictEqual(FILTERS.eq('peter', 'john'), false);
      });

      it('should work for "true"', () => {
        strictEqual(FILTERS.eq(true, 'true'), true);
      });

      it('should work for "false"', () => {
        strictEqual(FILTERS.eq(false, 'false'), true);
      });

      it('should work for "null"', () => {
        strictEqual(FILTERS.eq(null, 'null'), true);
      });

      it('should work on edge cases', () => {
        strictEqual(FILTERS.eq('', '0'), false);
        strictEqual(FILTERS.eq('', 'null'), false);
        strictEqual(FILTERS.eq('', 'false'), false);
        strictEqual(FILTERS.eq(0, ''), false);
        strictEqual(FILTERS.eq(0, 'null'), false);
        strictEqual(FILTERS.eq(0, 'false'), false);
        strictEqual(FILTERS.eq('0', ''), false);
        strictEqual(FILTERS.eq('0', 'null'), false);
        strictEqual(FILTERS.eq('0', 'false'), false);
        strictEqual(FILTERS.eq(null, ''), false);
        strictEqual(FILTERS.eq(null, '0'), false);
        strictEqual(FILTERS.eq(null, 'false'), false);
        strictEqual(FILTERS.eq(false, ''), false);
        strictEqual(FILTERS.eq(false, '0'), false);
        strictEqual(FILTERS.eq(false, 'null'), false);
      });
    });

    describe('ne', () => {
      it('should return false if the data is equal to the query', () => {
        strictEqual(FILTERS.ne('peter', 'peter'), false);
      });

      it('should return false if the data is equal to the query (number)', () => {
        strictEqual(FILTERS.ne(18, '18'), false);
      });

      it('should return false if the data is equal to the query (number, more complex)', () => {
        strictEqual(FILTERS.ne(18, '+18.00'), false);
      });

      it('should return true if the data is different from the query', () => {
        strictEqual(FILTERS.ne('peter', 'john'), true);
      });

      it('should work for "true"', () => {
        strictEqual(FILTERS.ne(true, 'true'), false);
      });

      it('should work for "false"', () => {
        strictEqual(FILTERS.ne(false, 'false'), false);
      });

      it('should work for "null"', () => {
        strictEqual(FILTERS.ne(null, 'null'), false);
      });

      it('should work on edge cases', () => {
        strictEqual(FILTERS.ne('', '0'), true);
        strictEqual(FILTERS.ne('', 'null'), true);
        strictEqual(FILTERS.ne('', 'false'), true);
        strictEqual(FILTERS.ne(0, ''), true);
        strictEqual(FILTERS.ne(0, 'null'), true);
        strictEqual(FILTERS.ne(0, 'false'), true);
        strictEqual(FILTERS.ne('0', ''), true);
        strictEqual(FILTERS.ne('0', 'null'), true);
        strictEqual(FILTERS.ne('0', 'false'), true);
        strictEqual(FILTERS.ne(null, ''), true);
        strictEqual(FILTERS.ne(null, '0'), true);
        strictEqual(FILTERS.ne(null, 'false'), true);
        strictEqual(FILTERS.ne(false, ''), true);
        strictEqual(FILTERS.ne(false, '0'), true);
        strictEqual(FILTERS.ne(false, 'null'), true);
      });
    });

    describe('gt', () => {
      it('should return true if the data is greater than the query', () => {
        strictEqual(FILTERS.gt(2, '1'), true);
      });

      it('should return false if the data is equal to the query', () => {
        strictEqual(FILTERS.gt(2, '2'), false);
      });

      it('should return false if the data is less than the query', () => {
        strictEqual(FILTERS.gt(2, '3'), false);
      });

      it('should use number ordering on numbers', () => {
        strictEqual(FILTERS.gt(2, '10'), false);
      });

      it('should use string ordering on strings', () => {
        strictEqual(FILTERS.gt('2', '10'), true);
      });
    });

    describe('gte', () => {
      it('should return true if the data is greater than the query', () => {
        strictEqual(FILTERS.gte(2, '1'), true);
      });

      it('should return true if the data is equal to the query', () => {
        strictEqual(FILTERS.gte(2, '2'), true);
      });

      it('should return false if the data is less than the query', () => {
        strictEqual(FILTERS.gte(2, '3'), false);
      });

      it('should use number ordering on numbers', () => {
        strictEqual(FILTERS.gte(2, '10'), false);
      });

      it('should use string ordering on strings', () => {
        strictEqual(FILTERS.gte('2', '10'), true);
      });
    });

    describe('lt', () => {
      it('should return false if the data is greater than the query', () => {
        strictEqual(FILTERS.lt(2, '1'), false);
      });

      it('should return false if the data is equal to the query', () => {
        strictEqual(FILTERS.lt(2, '2'), false);
      });

      it('should return true if the data is less than the query', () => {
        strictEqual(FILTERS.lt(2, '3'), true);
      });

      it('should use number ordering on numbers', () => {
        strictEqual(FILTERS.lt(2, '10'), true);
      });

      it('should use string ordering on strings', () => {
        strictEqual(FILTERS.lt('2', '10'), false);
      });
    });

    describe('lte', () => {
      it('should return false if the data is greater than the query', () => {
        strictEqual(FILTERS.lte(2, '1'), false);
      });

      it('should return true if the data is equal to the query', () => {
        strictEqual(FILTERS.lte(2, '2'), true);
      });

      it('should return true if the data is less than the query', () => {
        strictEqual(FILTERS.lte(2, '3'), true);
      });

      it('should use number ordering on numbers', () => {
        strictEqual(FILTERS.lte(2, '10'), true);
      });

      it('should use string ordering on strings', () => {
        strictEqual(FILTERS.lte('2', '10'), false);
      });
    });

    describe('like', () => {
      it('should return true if the data matches the query', () => {
        strictEqual(FILTERS.like('peter', 'peter'), true);
      });

      it('should return true if the data matches the query (number)', () => {
        strictEqual(FILTERS.like(18, '18'), true);
      });

      it('should return true if the data contains the query', () => {
        strictEqual(FILTERS.like('peter', 'et'), true);
      });

      it('should match case-insensitive', () => {
        strictEqual(FILTERS.like('peter', 'T'), true);
      });

      it('should return false if the data does not match the query', () => {
        strictEqual(FILTERS.like('peter', 'o'), false);
      });

      it('should match a regex', () => {
        strictEqual(FILTERS.like('peter', 'p.*r'), true);
        strictEqual(FILTERS.like('1', '^(1|2|3)$'), true);
      });
    });

    describe('start', () => {
      it('should return true if the data starts with the query', () => {
        strictEqual(FILTERS.start('peter', 'p'), true);
      });

      it('should return true if the data starts with the query (number)', () => {
        strictEqual(FILTERS.start(18, '1'), true);
      });

      it('should match case-insensitive', () => {
        strictEqual(FILTERS.start('peter', 'P'), true);
      });

      it('should return false if the data does not start with the query', () => {
        strictEqual(FILTERS.start('peter', 'e'), false);
      });

      it('should match a regex', () => {
        strictEqual(FILTERS.like('peter', 'p.*r'), true);
        strictEqual(FILTERS.like('1', '(1|2|3)$'), true);
      });
    });

    describe('end', () => {
      it('should return true if the data ends with the query', () => {
        strictEqual(FILTERS.end('peter', 'r'), true);
      });

      it('should return true if the data ends with the query (number)', () => {
        strictEqual(FILTERS.end(18, '8'), true);
      });

      it('should match case-insensitive', () => {
        strictEqual(FILTERS.end('peter', 'R'), true);
      });

      it('should return false if the data does not end with the query', () => {
        strictEqual(FILTERS.end('peter', 'e'), false);
      });

      it('should match a regex', () => {
        strictEqual(FILTERS.like('peter', 'p.*r'), true);
        strictEqual(FILTERS.like('1', '^(1|2|3)'), true);
      });
    });
  });
});
