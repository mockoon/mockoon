#!/usr/bin/env node

process.env.NODE_ENV = 'production';

(async () => {
  const oclif = await import('@oclif/core');
  await oclif.execute({ development: false, dir: __dirname });
})();
