const commonConfig = require('./electron-builder.common');

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = Object.assign({}, commonConfig, {
  linux: {
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
      Name: 'Mockoon',
      Type: 'Application',
      Categories: 'Development'
    },
    snap: {
      base: 'core22'
    }
  }
});

module.exports = config;
