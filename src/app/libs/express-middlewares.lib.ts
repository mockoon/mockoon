
export const ExpressMiddlewares = [
  // Remove multiple slash and replace by single slash
  (req, res, next) => {
    req.url = req.url.replace(/\/{2,}/g, '/');

    next();
  },
  // Parse body as a raw string
  (req, res, next) => {
    try {
      req.setEncoding('utf8');
      req.body = '';

      req.on('data', (chunk) => {
        req.body += chunk;
      });

      req.on('end', () => {
        next();
      });
    } catch (error) { }
  }
];
