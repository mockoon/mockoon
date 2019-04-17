export const fetch = (params: { protocol: 'http' | 'https', port: number, path: string, method: 'GET' | 'POST' | 'PUT' | 'HEAD' | 'OPTIONS' }) => {
  return new Promise((resolve, reject) => {
    const request = require(params.protocol).request({
      hostname: `localhost`,
      port: params.port,
      path: params.path,
      method: params.method.toUpperCase()
    }, (response) => {
      let body = '';
      response.on('data', (chunk) => body += chunk);
      response.on('end', () => resolve({ headers: response.headers, body }));
    });

    request.on('error', (err) => reject(err));

    request.end();
  });
};
