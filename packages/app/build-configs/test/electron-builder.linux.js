const commonConfig = require('../electron-builder.common');

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = Object.assign({}, commonConfig, {
  linux: {
    target: [
      {
        target: 'AppImage'
      }
    ],
    category: 'Development',
    icon: 'build-res',
    artifactName: 'mockoon-${version}.${ext}',
    desktop: {
      Name: 'Mockoon',
      Type: 'Application',
      Categories: 'Development'
    }
  }
});

module.exports = config;
