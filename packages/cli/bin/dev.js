#!/usr/bin/env node_modules/.bin/ts-node

process.env.NODE_ENV = 'development';

// eslint-disable-next-line node/shebang, unicorn/prefer-top-level-await
(async () => {
  const oclif = await import('@oclif/core');
  await oclif.execute({ development: true, dir: __dirname });
})();
