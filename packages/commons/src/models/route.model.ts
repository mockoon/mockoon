export type LogicalOperators = 'AND' | 'OR';

export enum BodyTypes {
  INLINE = 'INLINE',
  FILE = 'FILE',
  DATABUCKET = 'DATABUCKET'
}

export type RouteResponse = {
  uuid: string;
  rules: ResponseRule[];
  rulesOperator: LogicalOperators;
  statusCode: number;
  label: string;
  headers: Header[];
  body?: string;
  latency: number;
  bodyType: BodyTypes;
  filePath: string;
  databucketID: string;
  sendFileAsBody: boolean;
  disableTemplating: boolean;
  fallbackTo404: boolean;
  default: boolean;
  crudKey: string;
};

export enum ResponseMode {
  RANDOM = 'RANDOM',
  SEQUENTIAL = 'SEQUENTIAL',
  DISABLE_RULES = 'DISABLE_RULES',
  FALLBACK = 'FALLBACK'
}

export const RulesDisablingResponseModes: ResponseMode[] = [
  ResponseMode.RANDOM,
  ResponseMode.SEQUENTIAL,
  ResponseMode.DISABLE_RULES
];

export const RulesNotUsingDefaultResponse: ResponseMode[] = [
  ResponseMode.RANDOM,
  ResponseMode.SEQUENTIAL,
  ResponseMode.DISABLE_RULES,
  ResponseMode.FALLBACK
];

export type ResponseRuleOperators =
  | 'equals'
  | 'regex'
  | 'regex_i'
  | 'null'
  | 'empty_array';

export type ResponseRule = {
  target: ResponseRuleTargets;
  modifier: string;
  value: string;
  invert: boolean;
  operator: ResponseRuleOperators;
};

export type ResponseRuleTargets =
  | 'body'
  | 'query'
  | 'header'
  | 'params'
  | 'request_number'
  | 'cookie';

export enum RouteType {
  HTTP = 'http',
  CRUD = 'crud'
}

export type Route = {
  uuid: string;
  type: RouteType;
  documentation: string;
  method: keyof typeof Methods | '';
  endpoint: string;
  responses: RouteResponse[];
  enabled: boolean;
  responseMode: ResponseMode | null;
};

export type Header = { key: string; value: string };

export enum Methods {
  get = 'get',
  post = 'post',
  put = 'put',
  patch = 'patch',
  delete = 'delete',
  head = 'head',
  options = 'options',
  propfind = 'propfind',
  proppatch = 'proppatch',
  move = 'move',
  copy = 'copy',
  mkcol = 'mkcol',
  lock = 'lock',
  unlock = 'unlock'
}
