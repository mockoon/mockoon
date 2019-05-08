export type HttpCall = {
  description: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'OPTIONS';
  testedProperties: {
    body?: string;
    status?: number;
  }
};
