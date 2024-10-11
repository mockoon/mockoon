export type HeadersProperties =
  | 'headers'
  | 'proxyReqHeaders'
  | 'proxyResHeaders';

export type DropdownItem<T = string | number> = {
  category?: true;
  value?: T;
  label: string;
  classes?: string;
};

export type DropdownItems<T = string | number> = DropdownItem<T>[];

export type ToggleItem = {
  value?: number | string | boolean;
  label?: string;
  icon?: string;
  tooltip?: string;
  activeClass?: string;
};

export type ToggleItems = ToggleItem[];

export type Validation = {
  mask: string;
  maskPatterns: { [key in string]: { pattern: RegExp } };
  min?: number;
  max?: number;
};
