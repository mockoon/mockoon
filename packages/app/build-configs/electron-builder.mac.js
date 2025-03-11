const commonConfig = require('./electron-builder.common');

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = Object.assign({}, commonConfig, {
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['universal']
      },
      {
        target: 'dmg',
        arch: ['x64']
      },
      {
        target: 'dmg',
        arch: ['arm64']
      }
    ],
    type: 'distribution',
    artifactName: 'mockoon.setup.${version}.${arch}.${ext}',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build-res/entitlements.mac.plist',
    entitlementsInherit: 'build-res/entitlements.mac.plist'
  },
  dmg: {
    sign: false
  },
  afterSign: 'scripts/notarize.js'
});

module.exports = config;
