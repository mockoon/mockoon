import { Hook } from '@oclif/core';
import * as mkdirp from 'mkdirp';
import { Config } from '../config';

/**
 * Check that logs folder (`~/.mockoon-cli/logs`) exists before running commands
 */
export const hook: Hook<'init'> = async function (options) {
  await mkdirp(Config.logsPath);
};

export default hook;
