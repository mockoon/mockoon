export type HttpCallResponse = {
  body?: string | { contains: string } | RegExp;
  status?: number;
  headers?: {
    [key in string]: string | string[];
  };
};

export type HttpCall = {
  description?: string;
  protocol?: 'http' | 'https';
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'OPTIONS';
  headers?: { [key in string]: string | number };
  cookie?: string;
  body?: any;
  testedResponse?: HttpCallResponse;
};
