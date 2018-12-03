export const fetch = (params: { protocol: 'http' | 'https', port: number, path: string, method: 'get' | 'post' | 'put' | 'head' | 'options' }) => {
  return new Promise((resolve, reject) => {
    const request = require(params.protocol)[params.method](`${params.protocol}://localhost:${params.port}${params.path}`, (response) => {
      let body = '';
      response.on('data', (chunk) => body += chunk);
      response.on('end', () => resolve(body));
    });
    request.on('error', (err) => reject(err));
  });
};
