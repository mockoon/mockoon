const commonConfig = require('./electron-builder.common');

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = Object.assign({}, commonConfig, {
  win: {
    target: [{ target: 'appx' }]
  },
  appx: {
    publisherName: '1kB SARL-S',
    publisher: 'CN=F7BC8E8D-E7FB-4CF2-87B7-66105AC3B61D',
    publisherDisplayName: '1kB SARL-S',
    identityName: '1kB.mockoon',
    applicationId: 'mockoon',
    backgroundColor: '#ffffff',
    artifactName: 'mockoon.${version}.${ext}'
  }
});

module.exports = config;
