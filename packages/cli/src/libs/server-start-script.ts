import * as minimist from 'minimist';
import { createServer } from './server';

/**
 * Script used by PM2 to start/restart a mock server
 */
const argv = minimist<{
  data: string;
  environmentDir: string;
  logTransaction?: boolean;
}>(process.argv.slice(2));

if (argv.data) {
  createServer({
    data: argv.data,
    environmentDir: argv.environmentDir,
    logTransaction: argv.logTransaction
  });
}
