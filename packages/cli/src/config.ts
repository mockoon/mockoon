import { homedir } from 'os';
import { join } from 'path';
import { version } from '../package.json';

const dirName = '.mockoon-cli';

export const Config: { version: string; logsPath: string } = {
  version,
  logsPath: join(homedir(), `/${dirName}/logs/`)
};
