import { createInterface as readLineCreate } from 'node:readline/promises';
import { dirname } from 'path';

/**
 * Transform an environment name to be used as a process name
 *
 * @param environmentName
 */
export const transformEnvironmentName = (environmentName: string): string =>
  environmentName
    .trim()
    .toLowerCase()
    .replace(/[ /\\]/g, '-') || 'mock';

/**
 * Get the path directory, except if it's a URL.
 *
 * @param path
 * @returns
 */
export const getDirname = (path: string): string | null => {
  if (!path.startsWith('http')) {
    return dirname(path);
  }

  return null;
};

export const terminalColors = {
  reset: '\x1b[39m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

/**
 * Prompt the user for a yes/no confirmation in the terminal.
 *
 * @param message
 * @returns
 */
export const confirm = async (message: string): Promise<boolean> => {
  const readLine = readLineCreate({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });

  const answer = await readLine.question(
    `${terminalColors.blue}?${terminalColors.reset} ${message} ${terminalColors.gray}(y/n)${terminalColors.reset} `
  );

  readLine.close();

  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    return false;
  }

  return true;
};
