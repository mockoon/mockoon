import { Cookie, Header, Methods } from '@mockoon/commons';

export type EnvironmentLogs = { [key: string]: EnvironmentLog[] };

export type EnvironmentLogRequest = {
  headers: Header[];
  params: { name: string; value: string }[];
  query: string;
  queryParams: { name: string; value: string }[];
  body: string;
  isInvalidJson: boolean;
  httpVersion: string;
  mimeType?: string;
  cookies: Cookie[];
  startedAt: Date;
};

export type EnvironmentLogResponse = {
  status: number;
  statusMessage: string;
  headers: Header[];
  body: string;
  binaryBody: boolean;
  unzipped?: boolean;
  isInvalidJson: boolean;
  cookies: Cookie[];
};

export type EnvironmentLog = {
  UUID: string;
  routeUUID: string;
  routeResponseUUID: string;
  timestampMs: number;
  // full URL called
  url: string;
  fullUrl: string;
  proxyUrl?: string;
  // internal route matched
  route: string;
  method: keyof typeof Methods;
  proxied: boolean;
  request: EnvironmentLogRequest;
  response: EnvironmentLogResponse;
};

export type ActiveEnvironmentsLogUUIDs = {
  [key: string]: string;
};

export type HAR = {
  log: HARLog;
};

export type HARLog = {
  version: number;
  creator: HARAppInfo;
  browser?: HARAppInfo;
  pages?: HARPage[];
  entries: HAREntry[];
  comment?: string;
};

export type HARAppInfo = {
  name: string;
  version: string;
  comment?: string;
};

export type HARPage = {
  startedDateTime: string;
  id: string;
  title: string;
  pageTimings: HARPageTimings;
  comment?: string;
};

export type HARPageTimings = {
  onContentLoad?: number;
  onLoad?: number;
  comment?: number;
};

export type HAREntry = {
  pageref?: string;
  startedDateTime: string;
  time: number;
  request: HARRequest;
  response: HARResponse;
  cache: HARCache;
  timings: HARTimings;
  serverIPAddress?: string;
  connection?: string;
  comment?: string;
};

export type HARRequest = {
  method: string;
  url: string;
  httpVersion: string;
  cookies: HARCookie[];
  headers: HARHeader[];
  queryString: HARQueryString[];
  postData?: HARPostData;
  headersSize: number;
  bodySize: number;
  comment?: string;
};

export type HARResponse = {
  status: number;
  statusText: string;
  httpVersion: string;
  cookies: HARCookie[];
  headers: HARHeader[];
  content: HARContent;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
  comment?: string;
};

export type HARCookie = {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
  comment?: string;
};

export type HARHeader = {
  name: string;
  value: string;
  comment?: string;
};

export type HARQueryString = {
  name: string;
  value: string;
  comment?: string;
};

export type HARPostData = {
  mimeType: string;
  params: HARParam[];
  text: string;
  comment?: string;
};

export type HARParam = {
  name: string;
  value?: string;
  fileName?: string;
  contentType?: string;
  comment?: string;
};

export type HARContent = {
  size: number;
  compression?: number;
  mimeType: string;
  text?: string;
  encoding?: string;
  comment?: string;
};

export type HARCache = {
  beforeRequest?: HARCacheRequest;
  afterRequest?: HARCacheRequest;
  comment?: string;
};

export type HARCacheRequest = {
  expires?: string;
  lastAccess: string;
  eTag: string;
  hitCount: number;
  comment?: string;
};

export type HARTimings = {
  blocked?: number;
  dns?: number;
  connect?: number;
  send: number;
  wait: number;
  receive: number;
  ssl?: number;
  comment?: string;
};
