import { expect } from 'chai';
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

      expect(parseFilters(queryParams)).to.deep.equal(expected);
    });

    it('should parse the "ne" filter', () => {
      const queryParams = { name_ne: 'peter' };
      const expected: FilterData[] = [
        { path: 'name', filter: 'ne', value: 'peter' }
      ];

      expect(parseFilters(queryParams)).to.deep.equal(expected);
    });

    it('should parse the "gt" filter', () => {
      const queryParams = { age_gt: '18' };
      const expected: FilterData[] = [
        { path: 'age', filter: 'gt', value: '18' }
      ];

      expect(parseFilters(queryParams)).to.deep.equal(expected);
    });

    it('should parse the "gte" filter', () => {
      const queryParams = { age_gte: '18' };
      const expected: FilterData[] = [
        { path: 'age', filter: 'gte', value: '18' }
      ];

      expect(parseFilters(queryParams)).to.deep.equal(expected);
    });

    it('should parse the "lt" filter', () => {
      const queryParams = { age_lt: '18' };
      const expected: FilterData[] = [
        { path: 'age', filter: 'lt', value: '18' }
      ];

      expect(parseFilters(queryParams)).to.deep.equal(expected);
    });

    it('should parse the "lte" filter', () => {
      const queryParams = { age_lte: '18' };
      const expected: FilterData[] = [
        { path: 'age', filter: 'lte', value: '18' }
      ];

      expect(parseFilters(queryParams)).to.deep.equal(expected);
    });

    it('should parse the "like" filter', () => {
      const queryParams = { name_like: 'peter' };
      const expected: FilterData[] = [
        { path: 'name', filter: 'like', value: 'peter' }
      ];

      expect(parseFilters(queryParams)).to.deep.equal(expected);
    });

    it('should parse the "start" filter', () => {
      const queryParams = { name_start: 'peter' };
      const expected: FilterData[] = [
        { path: 'name', filter: 'start', value: 'peter' }
      ];

      expect(parseFilters(queryParams)).to.deep.equal(expected);
    });

    it('should parse the "end" filter', () => {
      const queryParams = { name_end: 'peter' };
      const expected: FilterData[] = [
        { path: 'name', filter: 'end', value: 'peter' }
      ];

      expect(parseFilters(queryParams)).to.deep.equal(expected);
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

      expect(parseFilters(queryParams)).to.deep.equal(expected);
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

      expect(parseFilters(queryParams)).to.deep.equal(expected);
    });

    it('should accept nested paths', () => {
      const queryParams = { 'user.name_eq': 'peter' };
      const expected: FilterData[] = [
        { path: 'user.name', filter: 'eq', value: 'peter' }
      ];

      expect(parseFilters(queryParams)).to.deep.equal(expected);
    });

    it('should accept nested paths (array)', () => {
      const queryParams = { 'users.0.name_eq': 'peter' };
      const expected: FilterData[] = [
        { path: 'users.0.name', filter: 'eq', value: 'peter' }
      ];

      expect(parseFilters(queryParams)).to.deep.equal(expected);
    });

    it('should accept paths with underscores', () => {
      const queryParams = { user_name_eq: 'peter' };
      const expected: FilterData[] = [
        { path: 'user_name', filter: 'eq', value: 'peter' }
      ];

      expect(parseFilters(queryParams)).to.deep.equal(expected);
    });

    it('should accept paths with underscores containing a filter name', () => {
      const queryParams = { user_like_like: 'peter' };
      const expected: FilterData[] = [
        { path: 'user_like', filter: 'like', value: 'peter' }
      ];

      expect(parseFilters(queryParams)).to.deep.equal(expected);
    });

    it('should accept more complex object-path notation', () => {
      const queryParams = { 'user.0.name_eq': 'peter' };
      const expected: FilterData[] = [
        { path: 'user.0.name', filter: 'eq', value: 'peter' }
      ];

      expect(parseFilters(queryParams)).to.deep.equal(expected);
    });

    it('should accept filters with empty path', () => {
      const queryParams = { _eq: 'peter' };
      const expected: FilterData[] = [
        { path: '', filter: 'eq', value: 'peter' }
      ];

      expect(parseFilters(queryParams)).to.deep.equal(expected);
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

      expect(applyFilter(data, filterData)).to.be.true;
    });

    it('should apply the "ne" filter', () => {
      const data = { name: 'peter' };
      const filterData: FilterData = {
        path: 'name',
        filter: 'ne',
        value: 'john'
      };

      expect(applyFilter(data, filterData)).to.be.true;
    });

    it('should apply the "gt" filter', () => {
      const data = { age: 20 };
      const filterData: FilterData = {
        path: 'age',
        filter: 'gt',
        value: '18'
      };

      expect(applyFilter(data, filterData)).to.be.true;
    });

    it('should apply the "gte" filter', () => {
      const data = { age: 20 };
      const filterData: FilterData = {
        path: 'age',
        filter: 'gte',
        value: '18'
      };

      expect(applyFilter(data, filterData)).to.be.true;
    });

    it('should apply the "lt" filter', () => {
      const data = { age: 20 };
      const filterData: FilterData = {
        path: 'age',
        filter: 'lt',
        value: '30'
      };

      expect(applyFilter(data, filterData)).to.be.true;
    });

    it('should apply the "lte" filter', () => {
      const data = { age: 20 };
      const filterData: FilterData = {
        path: 'age',
        filter: 'lte',
        value: '30'
      };

      expect(applyFilter(data, filterData)).to.be.true;
    });

    it('should apply the "like" filter', () => {
      const data = { name: 'peter' };
      const filterData: FilterData = {
        path: 'name',
        filter: 'like',
        value: 'et'
      };

      expect(applyFilter(data, filterData)).to.be.true;
    });

    it('should apply the "start" filter', () => {
      const data = { name: 'peter' };
      const filterData: FilterData = {
        path: 'name',
        filter: 'start',
        value: 'p'
      };

      expect(applyFilter(data, filterData)).to.be.true;
    });

    it('should apply the "end" filter', () => {
      const data = { name: 'peter' };
      const filterData: FilterData = {
        path: 'name',
        filter: 'end',
        value: 'r'
      };

      expect(applyFilter(data, filterData)).to.be.true;
    });

    it('should accept nested paths', () => {
      const data = { user: { name: 'peter' } };
      const filterData: FilterData = {
        path: 'user.name',
        filter: 'eq',
        value: 'peter'
      };

      expect(applyFilter(data, filterData)).to.be.true;
    });

    it('should accept nested paths (array)', () => {
      const data = { users: [{ name: 'peter' }] };
      const filterData: FilterData = {
        path: 'users.0.name',
        filter: 'eq',
        value: 'peter'
      };

      expect(applyFilter(data, filterData)).to.be.true;
    });

    it('should filter non-object values', () => {
      const data = 'peter';
      const filterData: FilterData = {
        path: '',
        filter: 'eq',
        value: 'peter'
      };

      expect(applyFilter(data, filterData)).to.be.true;
    });

    it('should not filter object values if path is empty', () => {
      const data = { name: 'peter' };
      const filterData: FilterData = {
        path: '',
        filter: 'eq',
        value: 'peter'
      };

      expect(applyFilter(data, filterData)).to.be.false;
    });
  });

  describe('FILTERS', () => {
    describe('eq', () => {
      it('should return true if the data is equal to the query', () => {
        expect(FILTERS.eq('peter', 'peter')).to.be.true;
      });

      it('should return true if the data is equal to the query (number)', () => {
        expect(FILTERS.eq(18, '18')).to.be.true;
      });

      it('should return true if the data is equal to the query (number, more complex)', () => {
        expect(FILTERS.eq(18, '+18.00')).to.be.true;
      });

      it('should return false if the data is different from the query', () => {
        expect(FILTERS.eq('peter', 'john')).to.be.false;
      });

      it('should work for "true"', () => {
        expect(FILTERS.eq(true, 'true')).to.be.true;
      });

      it('should work for "false"', () => {
        expect(FILTERS.eq(false, 'false')).to.be.true;
      });

      it('should work for "null"', () => {
        expect(FILTERS.eq(null, 'null')).to.be.true;
      });

      it('should work on edge cases', () => {
        expect(FILTERS.eq('', '0')).to.be.false;
        expect(FILTERS.eq('', 'null')).to.be.false;
        expect(FILTERS.eq('', 'false')).to.be.false;
        expect(FILTERS.eq(0, '')).to.be.false;
        expect(FILTERS.eq(0, 'null')).to.be.false;
        expect(FILTERS.eq(0, 'false')).to.be.false;
        expect(FILTERS.eq('0', '')).to.be.false;
        expect(FILTERS.eq('0', 'null')).to.be.false;
        expect(FILTERS.eq('0', 'false')).to.be.false;
        expect(FILTERS.eq(null, '')).to.be.false;
        expect(FILTERS.eq(null, '0')).to.be.false;
        expect(FILTERS.eq(null, 'false')).to.be.false;
        expect(FILTERS.eq(false, '')).to.be.false;
        expect(FILTERS.eq(false, '0')).to.be.false;
        expect(FILTERS.eq(false, 'null')).to.be.false;
      });
    });

    describe('ne', () => {
      it('should return false if the data is equal to the query', () => {
        expect(FILTERS.ne('peter', 'peter')).to.be.false;
      });

      it('should return false if the data is equal to the query (number)', () => {
        expect(FILTERS.ne(18, '18')).to.be.false;
      });

      it('should return false if the data is equal to the query (number, more complex)', () => {
        expect(FILTERS.ne(18, '+18.00')).to.be.false;
      });

      it('should return true if the data is different from the query', () => {
        expect(FILTERS.ne('peter', 'john')).to.be.true;
      });

      it('should work for "true"', () => {
        expect(FILTERS.ne(true, 'true')).to.be.false;
      });

      it('should work for "false"', () => {
        expect(FILTERS.ne(false, 'false')).to.be.false;
      });

      it('should work for "null"', () => {
        expect(FILTERS.ne(null, 'null')).to.be.false;
      });

      it('should work on edge cases', () => {
        expect(FILTERS.ne('', '0')).to.be.true;
        expect(FILTERS.ne('', 'null')).to.be.true;
        expect(FILTERS.ne('', 'false')).to.be.true;
        expect(FILTERS.ne(0, '')).to.be.true;
        expect(FILTERS.ne(0, 'null')).to.be.true;
        expect(FILTERS.ne(0, 'false')).to.be.true;
        expect(FILTERS.ne('0', '')).to.be.true;
        expect(FILTERS.ne('0', 'null')).to.be.true;
        expect(FILTERS.ne('0', 'false')).to.be.true;
        expect(FILTERS.ne(null, '')).to.be.true;
        expect(FILTERS.ne(null, '0')).to.be.true;
        expect(FILTERS.ne(null, 'false')).to.be.true;
        expect(FILTERS.ne(false, '')).to.be.true;
        expect(FILTERS.ne(false, '0')).to.be.true;
        expect(FILTERS.ne(false, 'null')).to.be.true;
      });
    });

    describe('gt', () => {
      it('should return true if the data is greater than the query', () => {
        expect(FILTERS.gt(2, '1')).to.be.true;
      });

      it('should return false if the data is equal to the query', () => {
        expect(FILTERS.gt(2, '2')).to.be.false;
      });

      it('should return false if the data is less than the query', () => {
        expect(FILTERS.gt(2, '3')).to.be.false;
      });

      it('should use number ordering on numbers', () => {
        expect(FILTERS.gt(2, '10')).to.be.false;
      });

      it('should use string ordering on strings', () => {
        expect(FILTERS.gt('2', '10')).to.be.true;
      });
    });

    describe('gte', () => {
      it('should return true if the data is greater than the query', () => {
        expect(FILTERS.gte(2, '1')).to.be.true;
      });

      it('should return true if the data is equal to the query', () => {
        expect(FILTERS.gte(2, '2')).to.be.true;
      });

      it('should return false if the data is less than the query', () => {
        expect(FILTERS.gte(2, '3')).to.be.false;
      });

      it('should use number ordering on numbers', () => {
        expect(FILTERS.gte(2, '10')).to.be.false;
      });

      it('should use string ordering on strings', () => {
        expect(FILTERS.gte('2', '10')).to.be.true;
      });
    });

    describe('lt', () => {
      it('should return false if the data is greater than the query', () => {
        expect(FILTERS.lt(2, '1')).to.be.false;
      });

      it('should return false if the data is equal to the query', () => {
        expect(FILTERS.lt(2, '2')).to.be.false;
      });

      it('should return true if the data is less than the query', () => {
        expect(FILTERS.lt(2, '3')).to.be.true;
      });

      it('should use number ordering on numbers', () => {
        expect(FILTERS.lt(2, '10')).to.be.true;
      });

      it('should use string ordering on strings', () => {
        expect(FILTERS.lt('2', '10')).to.be.false;
      });
    });

    describe('lte', () => {
      it('should return false if the data is greater than the query', () => {
        expect(FILTERS.lte(2, '1')).to.be.false;
      });

      it('should return true if the data is equal to the query', () => {
        expect(FILTERS.lte(2, '2')).to.be.true;
      });

      it('should return true if the data is less than the query', () => {
        expect(FILTERS.lte(2, '3')).to.be.true;
      });

      it('should use number ordering on numbers', () => {
        expect(FILTERS.lte(2, '10')).to.be.true;
      });

      it('should use string ordering on strings', () => {
        expect(FILTERS.lte('2', '10')).to.be.false;
      });
    });

    describe('like', () => {
      it('should return true if the data matches the query', () => {
        expect(FILTERS.like('peter', 'peter')).to.be.true;
      });

      it('should return true if the data matches the query (number)', () => {
        expect(FILTERS.like(18, '18')).to.be.true;
      });

      it('should return true if the data contains the query', () => {
        expect(FILTERS.like('peter', 'et')).to.be.true;
      });

      it('should match case-insensitive', () => {
        expect(FILTERS.like('peter', 'T')).to.be.true;
      });

      it('should return false if the data does not match the query', () => {
        expect(FILTERS.like('peter', 'o')).to.be.false;
      });

      it('should match a regex', () => {
        expect(FILTERS.like('peter', 'p.*r')).to.be.true;
        expect(FILTERS.like('1', '^(1|2|3)$')).to.be.true;
      });
    });

    describe('start', () => {
      it('should return true if the data starts with the query', () => {
        expect(FILTERS.start('peter', 'p')).to.be.true;
      });

      it('should return true if the data starts with the query (number)', () => {
        expect(FILTERS.start(18, '1')).to.be.true;
      });

      it('should match case-insensitive', () => {
        expect(FILTERS.start('peter', 'P')).to.be.true;
      });

      it('should return false if the data does not start with the query', () => {
        expect(FILTERS.start('peter', 'e')).to.be.false;
      });

      it('should match a regex', () => {
        expect(FILTERS.like('peter', 'p.*r')).to.be.true;
        expect(FILTERS.like('1', '(1|2|3)$')).to.be.true;
      });
    });

    describe('end', () => {
      it('should return true if the data ends with the query', () => {
        expect(FILTERS.end('peter', 'r')).to.be.true;
      });

      it('should return true if the data ends with the query (number)', () => {
        expect(FILTERS.end(18, '8')).to.be.true;
      });

      it('should match case-insensitive', () => {
        expect(FILTERS.end('peter', 'R')).to.be.true;
      });

      it('should return false if the data does not end with the query', () => {
        expect(FILTERS.end('peter', 'e')).to.be.false;
      });

      it('should match a regex', () => {
        expect(FILTERS.like('peter', 'p.*r')).to.be.true;
        expect(FILTERS.like('1', '^(1|2|3)')).to.be.true;
      });
    });
  });
});
