const commonConfig = require('./electron-builder.common');

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = Object.assign({}, commonConfig, {
  win: {
    target: [{ target: 'nsis' }, { target: 'portable' }],
    publisherName: '1kB SARL-S',
    rfc3161TimeStampServer: 'http://timestamp.acs.microsoft.com',
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
