import { promises as fs } from 'fs';
import * as glob from 'glob';
import * as mkdirp from 'mkdirp';
import { basename } from 'path';
import { promisify } from 'util';

class Bootstrap {
  public async init(): Promise<void> {
    await this.prepareStorageFolder();
    await this.copyAllDataFiles();
  }

  /**
   * Empty the storage folder and (re)create it if needed
   */
  private async prepareStorageFolder() {
    try {
      const storagePath = './tmp/storage/';

      await fs.rm(storagePath, { recursive: true, force: true });

      await mkdirp(storagePath);
    } catch (err) {}
  }

  /**
   * Copy environments files and settings
   */
  private async copyAllDataFiles() {
    // list all environment file including from old storage (for migration tests)
    const envFiles = await promisify(glob)('./test/data/mock-envs/*.json');

    try {
      if (envFiles) {
        for (const filePath of envFiles) {
          const filename = basename(filePath);
          await fs.copyFile(filePath, `./tmp/storage/${filename}`);
        }
      }
      await fs.copyFile(
        './test/data/mock-settings/settings.json',
        './tmp/storage/settings.json'
      );
    } catch (error) {}
  }
}

export default new Bootstrap();
