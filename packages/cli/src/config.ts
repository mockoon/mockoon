import { homedir } from 'os';
import { join } from 'path';

const version = require('../package.json').version;
const dirName = '.mockoon-cli';

/**
 * Configuration for pulling environments from Mockoon Cloud
 *
 * When a URL with the 'cloud://' scheme is provided, the CLI will
 * fetch the environment from the Mockoon Cloud API.
 */
const cloudScheme = 'cloud://';
const cloudApiUrl =
  process.env.NODE_ENV === 'production'
    ? 'https://api.mockoon.com/environments'
    : 'http://localhost:5003/environments';

export const Config: {
  version: string;
  logsPath: string;
  cloudScheme: string;
  cloudApiUrl: string;
} = {
  version,
  cloudScheme,
  cloudApiUrl,
  logsPath: join(homedir(), `/${dirName}/logs/`)
};
