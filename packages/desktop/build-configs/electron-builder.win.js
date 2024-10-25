const commonConfig = require('./electron-builder.common');

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = Object.assign({}, commonConfig, {
  forceCodeSigning: true,
  win: {
    target: [{ target: 'nsis' }, { target: 'portable' }],
    publisherName: '1kB SARL-S',
    azureSignOptions: {
      endpoint: 'https://eus.codesigning.azure.net',
      // respect casing
      certificateProfileName: 'Mockoon',
      codeSigningAccountName: 'mockoon',
      TimestampRfc3161: 'http://timestamp.acs.microsoft.com',
      TimestampDigest: 'SHA256'
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
