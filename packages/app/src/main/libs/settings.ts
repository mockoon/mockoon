import { readJSONData, writeJSONData } from 'src/main/libs/storage';
import { Settings } from 'src/shared/models/settings.model';

let settings: Settings;

/**
 * Save settings to the storage (electron-json-storage) using a key 'settings'
 * It will save the settings to the user data storage folder:
 * 'settings' --> /%USER_DATA%/mockoon/storage/settings.json
 */
export const saveSettings = async (
  newSettings: Settings,
  storagePrettyPrint?: boolean
): Promise<void> => {
  settings = newSettings;

  return await writeJSONData(newSettings, 'settings', storagePrettyPrint);
};

/**
 * Read settings from the storage (electron-json-storage) using a key 'settings'
 * It will retrieve the settings from the user data storage folder:
 * 'settings' --> /%USER_DATA%/mockoon/storage/settings.json
 */
export const loadSettings = async (): Promise<Settings> => {
  settings = await readJSONData('settings');

  return settings;
};

/**
 * Returns the up-to-date app settings store in the main process
 *
 * @returns
 */
export const getSettings = (): Settings => settings;
