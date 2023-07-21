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
    .replace(/[ \/\\]/g, '-') || 'mock';

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
