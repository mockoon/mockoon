export type HeadersProperties =
  'headers' | 'proxyReqHeaders' | 'proxyResHeaders';

export type DropdownItem<T = string | number> = {
  category?: true;
  value?: T;
  label: string;
  classes?: string;
};

export type DropdownItems<T = string | number> = DropdownItem<T>[];

export type RadioItem = {
  value: number | string;
  label?: string;
  icon?: string;
  iconSize?: number;
  tooltip?: string;
  activeClass?: string;
};

export type RadioItems = RadioItem[];

export type CheckboxItem = {
  label?: string;
  icon?: string;
  iconSize?: number;
  tooltip?: string;
  activeClass?: string;
};

export type Validation = {
  mask: string;
  maskPatterns: Record<string, { pattern: RegExp }>;
  min?: number;
  max?: number;
};
