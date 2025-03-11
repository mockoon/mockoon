export type HttpCallResponse = {
  body?: string | { contains: string } | RegExp;
  status?: number;
  statusMessage?: string;
  headers?: Record<string, string | string[]>;
  cert?: {
    issuer: {
      C?: string;
      CN?: string;
      O?: string;
      ST?: string;
    };
  };
};

export type HttpCall = {
  description?: string;
  protocol?: 'http' | 'https';
  path: string;
  method:
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'HEAD'
    | 'OPTIONS'
    | 'DELETE'
    | 'PURGE';
  headers?: Record<string, string | string[] | number>;
  cookie?: string;
  body?: any;
  testedResponse?: HttpCallResponse;
};
