const commonConfig = require('../electron-builder.common');

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = Object.assign({}, commonConfig, {
  electronFuses: {
    enableNodeCliInspectArguments: true
  },
  win: {
    target: [{ target: 'nsis' }],
    signtoolOptions: {
      publisherName: '1kB SARL-S'
    }
  },
  nsis: {
    artifactName: 'mockoon.setup.${version}.${ext}'
  }
});

module.exports = config;
