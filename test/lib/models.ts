export type HttpCallResponse = {
  body?: string;
  status?: number;
  headers?: {
    [key in string]: string | string[];
  };
};

export type HttpCall = {
  description?: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'OPTIONS';
  headers?: { [key in string]: string | number };
  cookie?: string;
  body?: any;
  testedResponse?: HttpCallResponse;
};
