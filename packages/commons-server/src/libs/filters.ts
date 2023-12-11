import { Request } from 'express';
import { get as objectGet } from 'object-path';

const isNum = (value: string) => !isNaN(parseFloat(value));

export const FILTERS = {
  eq: (data, query) =>
    String(data) === query || (isNum(data) && isNum(query) && data == query),
  ne: (data, query) =>
    String(data) !== query && (!isNum(data) || !isNum(query) || data != query),
  gt: (data, query) => data > query,
  gte: (data, query) => data >= query,
  lt: (data, query) => data < query,
  lte: (data, query) => data <= query,
  like: (data, query) => new RegExp(query, 'i').test(String(data)),
  start: (data, query) => new RegExp(`^${query}`, 'i').test(String(data)),
  end: (data, query) => new RegExp(`${query}$`, 'i').test(String(data))
} satisfies Record<string, (data: any, query: string) => boolean>;

const FILTERS_REGEX = `^(.*)_(${Object.keys(FILTERS).join('|')})$`;

export function parseFilters(queryParams: Request['query']): FilterData[] {
  const result: FilterData[] = [];

  for (const key in queryParams) {
    const value = queryParams[key] as string;
    const match = key.match(FILTERS_REGEX);

    if (match) {
      const [, path, filter] = match as [string, string, Filter];
      result.push({ path, filter, value });
    }
  }

  return result;
}

export function applyFilter(data: any, filterData: FilterData): boolean {
  const { filter, path, value } = filterData;

  return FILTERS[filter](objectGet(data, path), value);
}

export type Filter = keyof typeof FILTERS;

export type FilterData = {
  path: string;
  filter: Filter;
  value: string;
};
