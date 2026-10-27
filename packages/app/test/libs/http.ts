import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { HttpCall, HttpCallResponse } from './models';

const RequestsLibraries = {
  http: httpRequest,
  https: httpsRequest
};

class Http {
  public async assertCallWithPort(httpCall: HttpCall, port: number) {
    return await this.assertCallWithPortAndHostname(
      httpCall,
      port,
      'localhost'
    );
  }

  public async assertCallWithPortAndHostname(
    httpCall: HttpCall,
    port: number,
    hostname: string
  ) {
    const response = await this.fetch({
      hostname,
      protocol: httpCall.protocol || 'http',
      port,
      path: httpCall.path,
      method: httpCall.method,
      headers: httpCall.headers ?? {},
      body: httpCall.body,
      cookie: httpCall.cookie ?? ''
    });

    if (httpCall.testedResponse != null) {
      const testedResponse = httpCall.testedResponse;

      Object.keys(testedResponse).forEach((propertyName) => {
        if (propertyName === 'headers' && testedResponse.headers != null) {
          const responseHeaders = response.headers ?? {};

          Object.keys(testedResponse?.headers ?? {}).forEach((headerName) => {
            const responseHeader = response.headers?.[headerName];

            if (Array.isArray(responseHeaders[headerName])) {
              (responseHeaders[headerName] as string[]).forEach(
                (expectedHeader) => {
                  expect(responseHeader).toContain(expectedHeader);
                }
              );
            } else {
              expect(responseHeader).not.toEqual(undefined);
              expect(responseHeader).toContain(responseHeaders[headerName]);
            }
          });
        } else if (
          propertyName === 'body' &&
          testedResponse?.body instanceof RegExp
        ) {
          expect(response.body).toMatch(testedResponse?.body);
        } else if (
          propertyName === 'body' &&
          typeof testedResponse?.body === 'object'
        ) {
          expect(response.body).toContain(
            (testedResponse?.body as { contains: string }).contains
          );
        } else {
          expect(response[propertyName]).toEqual(testedResponse[propertyName]);
        }
      });
    } else {
      return response;
    }
  }

  public async assertCall(httpCall: HttpCall) {
    return await this.assertCallWithPort(httpCall, 3000);
  }

  private fetch(params: {
    hostname: string;
    protocol: 'http' | 'https';
    port: number;
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
    headers: Record<string, string | string[] | number>;
    body: any;
    cookie: string;
  }): Promise<HttpCallResponse> {
    let data = '';

    if (typeof params.body === 'string') {
      data = params.body;
    } else if (params.body) {
      data = JSON.stringify(params.body);
    }

    params.hostname = params.hostname ?? 'localhost';

    return new Promise((resolve, reject) => {
      const headers: Record<string, string | string[] | number> = {
        ...params.headers,
        'Content-Length': data.length
      };

      if (params.cookie) {
        headers['Cookie'] = `${params.cookie}; expires=${new Date(
          new Date().getTime() + 86409000
        )}`;
      }

      const request = RequestsLibraries[params.protocol](
        {
          hostname: params.hostname,
          port: params.port,
          path: params.path,
          method: params.method.toUpperCase(),
          headers,
          rejectUnauthorized: false
        },
        (response) => {
          let body = '';
          response.on('data', (chunk) => (body += chunk));
          response.on('end', () =>
            resolve({
              status: response.statusCode,
              statusMessage: response.statusMessage,
              headers: response.headers ?? {},
              body
            })
          );
        }
      );

      request.on('error', (err) => {
        reject(err);
      });
      request.write(data);
      request.end();
    });
  }
}

export default new Http();
