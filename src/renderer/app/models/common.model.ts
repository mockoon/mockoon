export type SelectOptionsList<Codes extends string> = {
  code: Codes;
  text: string;
}[];

export type HeadersProperties =
  | 'headers'
  | 'proxyReqHeaders'
  | 'proxyResHeaders';

export type DropdownItem = {
  category?: true;
  value?: number | string;
  label: string;
  classes?: string;
};

export type DropdownItems = DropdownItem[];

export type Validation = {
  mask: string;
  maskPatterns: { [key in string]: { pattern: RegExp } };
  min?: number;
  max?: number;
};
