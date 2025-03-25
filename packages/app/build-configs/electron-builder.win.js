const commonConfig = require('./electron-builder.common');

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = Object.assign({}, commonConfig, {
  forceCodeSigning: true,
  win: {
    target: [{ target: 'nsis' }, { target: 'portable' }],
    signtoolOptions: {
      publisherName: '1kB SARL-S'
    },
    azureSignOptions: {
      endpoint: 'https://eus.codesigning.azure.net',
      // respect casing
      certificateProfileName: 'Mockoon',
      codeSigningAccountName: 'mockoon'
    }
  },
  nsis: {
    artifactName: 'mockoon.setup.${version}.${ext}'
  },
  portable: {
    artifactName: 'mockoon.portable.${version}.${ext}'
  }
});

module.exports = config;
