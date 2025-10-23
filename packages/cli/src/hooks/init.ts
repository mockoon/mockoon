import { Hook } from '@oclif/core';
import { mkdir } from 'node:fs/promises';
import { Config } from '../config';

/**
 * Check that logs folder (`~/.mockoon-cli/logs`) exists before running commands
 */
export const hook: Hook<'init'> = async function () {
  await mkdir(Config.logsPath, { recursive: true });
};

export default hook;
