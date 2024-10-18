export type LogicalOperators = 'AND' | 'OR';

export enum BodyTypes {
  INLINE = 'INLINE',
  FILE = 'FILE',
  DATABUCKET = 'DATABUCKET'
}

export type CallbackInvocation = {
  uuid: string;
  latency: number;
};

export type RouteResponse = {
  uuid: string;
  rules: ResponseRule[];
  rulesOperator: LogicalOperators;
  statusCode: number;
  label: string;
  headers: Header[];
  body: string;
  latency: number;
  bodyType: BodyTypes;
  filePath: string;
  databucketID: string;
  sendFileAsBody: boolean;
  disableTemplating: boolean;
  fallbackTo404: boolean;
  // default is always true for CRUD routes first response
  default: boolean;
  crudKey: string;
  callbacks: CallbackInvocation[];
};

export enum ResponseMode {
  RANDOM = 'RANDOM',
  SEQUENTIAL = 'SEQUENTIAL',
  DISABLE_RULES = 'DISABLE_RULES',
  FALLBACK = 'FALLBACK'
}

export enum StreamingMode {
  UNICAST = 'UNICAST',
  BROADCAST = 'BROADCAST'
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
  | 'empty_array'
  | 'array_includes'
  | 'valid_json_schema';

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
  | 'cookie'
  | 'params'
  | 'path'
  | 'method'
  | 'request_number'
  | 'global_var'
  | 'data_bucket'
  | 'templating';

export enum RouteType {
  HTTP = 'http',
  CRUD = 'crud',
  WS = 'ws'
}

export type Route = {
  uuid: string;
  type: RouteType;
  documentation: string;
  method: keyof typeof Methods | '';
  endpoint: string;
  responses: RouteResponse[];
  responseMode: ResponseMode | null;
  // used in websocket routes
  streamingMode: StreamingMode | null;
  streamingInterval: number;
};

export type Header = { key: string; value: string };

export enum Methods {
  all = 'all',
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
