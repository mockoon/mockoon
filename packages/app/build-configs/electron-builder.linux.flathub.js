const commonConfig = require('./electron-builder.common');

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = Object.assign({}, commonConfig, {
  linux: {
    executableName: 'mockoon',
    target: ['dir'],
    category: 'Development',
    icon: 'build-res',
    desktop: {
      entry: {
        Name: 'Mockoon',
        Type: 'Application',
        Categories: 'Development'
      }
    }
  }
});

module.exports = config;
