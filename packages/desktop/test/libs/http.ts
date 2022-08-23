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
      headers: httpCall.headers,
      body: httpCall.body,
      cookie: httpCall.cookie
    });

    if (httpCall.testedResponse) {
      Object.keys(httpCall.testedResponse).forEach((propertyName) => {
        if (propertyName === 'headers') {
          Object.keys(httpCall.testedResponse.headers).forEach((headerName) => {
            const responseHeader = response.headers[headerName];

            if (Array.isArray(httpCall.testedResponse.headers[headerName])) {
              (httpCall.testedResponse.headers[headerName] as string[]).forEach(
                (expectedHeader) => {
                  expect(responseHeader).toContain(expectedHeader);
                }
              );
            } else {
              expect(responseHeader).not.toEqual(undefined);
              expect(responseHeader).toContain(
                httpCall.testedResponse.headers[headerName]
              );
            }
          });
        } else if (
          propertyName === 'body' &&
          httpCall.testedResponse.body instanceof RegExp
        ) {
          expect(response.body).toMatch(httpCall.testedResponse.body);
        } else if (
          propertyName === 'body' &&
          typeof httpCall.testedResponse.body === 'object'
        ) {
          expect(response.body).toContain(
            (httpCall.testedResponse.body as { contains: string }).contains
          );
        } else if (
          propertyName === 'cert' &&
          typeof httpCall.testedResponse.cert === 'object'
        ) {
          expect(response.cert).toMatchObject(httpCall.testedResponse.cert);
        } else {
          expect(response[propertyName]).toEqual(
            httpCall.testedResponse[propertyName]
          );
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
    method: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'OPTIONS';
    headers: { [key in string]: string | string[] | number };
    body: any;
    cookie: string;
  }): Promise<HttpCallResponse> {
    const data =
      typeof params.body === 'string'
        ? params.body
        : JSON.stringify(params.body || {});

    params.hostname = params.hostname ?? 'localhost';

    return new Promise((resolve, reject) => {
      const headers = {
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
              headers: response.headers,
              body,
              cert: (response?.connection as any).getPeerCertificate
                ? (response?.connection as any).getPeerCertificate()
                : null
            })
          );
        }
      );

      request.on('error', (err) => {
        console.log(err);
        reject(err);
      });
      request.write(data);
      request.end();
    });
  }
}

export default new Http();
