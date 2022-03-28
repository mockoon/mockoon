/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  appId: 'com.mockoon.app',
  productName: 'Mockoon',
  extraMetadata: { name: 'mockoon' },
  directories: {
    output: 'packages',
    buildResources: 'build-res'
  },
  files: [
    'package.json',
    'dist/**/*',
    'node_modules',
    'build-res/icon_512x512x32.png'
  ],
  protocols: [
    {
      name: 'Mockoon',
      schemes: ['mockoon'],
      role: 'Editor'
    }
  ]
};

module.exports = config;
