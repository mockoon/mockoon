import { Server } from 'http';
import { brotliCompress, deflate, gzip } from 'zlib';

const express = require('express');
const compressionLibs = { gzip, deflate, br: brotliCompress };

export const fakeServer = (done: () => void): Server => {
  const app = express();
  app.get('/test', (req, res) => {
    res.status(200);
    const encoding = req.get('Accept-Encoding');
    if (encoding && encoding !== 'identity') {
      compressionLibs[encoding](`${encoding}test`, (error, result) => {
        if (error) {
          throw error;
        }
        res.set('Content-Encoding', encoding);
        res.send(result);
      });
    } else {
      res.send('test');
    }
  });

  return app.listen(3999, () => {
    done();
  });
};
