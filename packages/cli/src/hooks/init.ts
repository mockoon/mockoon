import { Hook } from '@oclif/config';
import * as mkdirp from 'mkdirp';
import { Config } from '../config';

/**
 * Check that data folder (`~/.mockoon-cli/data`) exists before running commands
 */
export const hook: Hook<'init'> = async function (options) {
  await mkdirp(Config.dataPath);
};

export default hook;
