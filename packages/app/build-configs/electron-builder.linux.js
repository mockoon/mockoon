const commonConfig = require('./electron-builder.common');

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = Object.assign({}, commonConfig, {
  afterPack: ({ targets }) => {
    for (const target of targets) {
      if (target.name !== 'snap') {
        continue;
      }

      // Work around electron-builder core24 desktop source path.
      // Clone the shared helper so other Linux targets remain unaffected.
      const helper = target.helper;
      target.helper = Object.create(helper);
      target.helper.getSnapCore = () => {
        const core = helper.getSnapCore();
        const createDescriptor = core.createDescriptor.bind(core);
        core.createDescriptor = async (arch) => {
          const descriptor = await createDescriptor(arch);
          for (const app of Object.values(descriptor.apps)) {
            if (app.desktop?.startsWith('meta/gui/')) {
              app.desktop = app.desktop.replace(/^meta\/gui\//, 'gui/');
            }
          }

          return descriptor;
        };

        return core;
      };
    }
  },
  linux: {
    executableName: 'mockoon',
    syncDesktopName: true,
    target: [
      {
        target: 'AppImage',
        arch: ['x64', 'arm64']
      },
      {
        target: 'snap',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64', 'arm64']
      },
      {
        target: 'rpm',
        arch: ['x64']
      }
    ],
    category: 'Development',
    icon: 'build-res',
    artifactName: 'mockoon-${version}.${arch}.${ext}',
    desktop: {
      entry: {
        Name: 'Mockoon',
        Type: 'Application',
        Categories: 'Development'
      }
    }
  },
  rpm: {
    // Avoid /usr/lib/.build-id collisions with other Electron RPMs.
    fpm: ['--rpm-rpmbuild-define', '_build_id_links none']
  },
  snapcraft: {
    base: 'core24',
    core24: {
      confinement: 'strict',
      plugs: ['default'],
      // fix multiple "permission denied"
      executableArgs: ['--no-sandbox', '--disable-dev-shm-usage'],
      useLXD: true
    }
  }
});

module.exports = config;
