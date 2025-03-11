import {
  DataOptions,
  get as storageGet,
  set as storageSet
} from 'electron-json-storage';
import { parse as pathParse } from 'path';
import { promisify } from 'util';

/**
 * Read JSON data from a file.
 * Path can either be a full relative or absolute path, or a key.
 * (see electron-json-storage for more info)
 *
 * @param path
 * @returns
 */
export const readJSONData = async (path: string) => {
  const options: DataOptions = { dataPath: '' };

  const parsedPath = pathParse(path);

  if (parsedPath.dir) {
    options.dataPath = parsedPath.dir;
  }

  try {
    const data = await promisify<string, DataOptions, any>(storageGet)(
      parsedPath.name,
      options
    );

    // if object is empty return null instead (electron json storage returns empty object if file does not exists)
    if (
      !data ||
      (Object.keys(data).length === 0 && data.constructor === Object)
    ) {
      return null;
    }

    return data;
  } catch (_error) {
    // if file empty (JSON.parse error), it will throw
    return null;
  }
};

/**
 * Write JSON data to a file, eventually pretty printed.
 * Path can either be a full relative or absolute path, or a key.
 * (see electron-json-storage for more info)
 *
 * @param data
 * @param path
 * @param storagePrettyPrint
 * @returns
 */
export const writeJSONData = async (
  data: any,
  path: string,
  storagePrettyPrint?: boolean
) => {
  const options: DataOptions & { prettyPrinting?: boolean } = {
    dataPath: '',
    prettyPrinting: storagePrettyPrint
  };

  const parsedPath = pathParse(path);

  if (parsedPath.dir) {
    options.dataPath = parsedPath.dir;
  }

  return await promisify<string, any, DataOptions>(storageSet)(
    parsedPath.name,
    data,
    options
  );
};
