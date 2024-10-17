import { Hook } from '@oclif/core';
import { mkdirp } from 'mkdirp';
import { Config } from '../config';

/**
 * Check that logs folder (`~/.mockoon-cli/logs`) exists before running commands
 */
export const hook: Hook<'init'> = async function () {
  await mkdirp(Config.logsPath);
};

export default hook;
