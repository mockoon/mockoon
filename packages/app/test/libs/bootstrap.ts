import { promises as fs } from 'fs';
import { glob } from 'glob';
import { mkdir } from 'node:fs/promises';
import { basename } from 'path';

class Bootstrap {
  public async init(specs?: string[] | string): Promise<void> {
    await this.prepareStorageFolder();
    await this.copyAllDataFiles(specs);
  }

  /**
   * Empty the storage folder and (re)create it if needed
   */
  private async prepareStorageFolder() {
    try {
      const storagePath = './tmp/storage/';

      await fs.rm(storagePath, { recursive: true, force: true });

      await mkdir(storagePath, { recursive: true });
    } catch (_error) {}
  }

  /**
   * Resolve the settings seed file for the current spec, if present.
   * Expected files are located under ./test/data/mock-settings and named after
   * the spec file (e.g. changelog-modal.json, schema-validation.json).
   */
  private async resolveSettingsFile(
    specs?: string[] | string
  ): Promise<string> {
    const specFiles = Array.isArray(specs) ? specs : specs ? [specs] : [];

    for (const specFile of specFiles) {
      if (!specFile) {
        continue;
      }

      const fileName = basename(specFile);
      const candidates = [
        fileName.replace(/\.spec\.ts$/, '.json'),
        fileName.replace(/\.ts$/, '.json'),
        fileName.replace(/\.spec\.js$/, '.json'),
        fileName.replace(/\.js$/, '.json')
      ];

      const uniqueCandidates = [...new Set(candidates)];

      for (const candidate of uniqueCandidates) {
        const settingsPath = `./test/data/mock-settings/${candidate}`;

        try {
          await fs.access(settingsPath);

          return settingsPath;
        } catch (_error) {}
      }
    }

    return './test/data/mock-settings/settings.json';
  }

  /**
   * Copy environments files and settings
   */
  private async copyAllDataFiles(specs?: string[] | string) {
    // list all environment file including from old storage (for migration tests)
    const envFiles = await glob('./test/data/mock-envs/*.json');
    const settingsFile = await this.resolveSettingsFile(specs);

    try {
      if (envFiles) {
        for (const filePath of envFiles) {
          const filename = basename(filePath);
          await fs.copyFile(filePath, `./tmp/storage/${filename}`);
        }
      }
      await fs.copyFile(settingsFile, './tmp/storage/settings.json');
    } catch (_error) {}
  }
}

export default new Bootstrap();
