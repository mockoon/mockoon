export type SelectOptionsList<Codes extends string> = {
  code: Codes;
  text: string;
}[];

export type HeadersProperties =
  | 'headers'
  | 'proxyReqHeaders'
  | 'proxyResHeaders';
