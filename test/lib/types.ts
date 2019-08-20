export type HttpCall = {
  description?: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'OPTIONS';
  headers?: { [key in string]: string };
  body?: any;
  testedProperties: {
    body?: string;
    status?: number;
  };
};
