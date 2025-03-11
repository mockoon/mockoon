const macConfig = require('./electron-builder.mac.js');

const unsignedConfig = Object.assign({}, macConfig);

delete unsignedConfig.afterSign;

module.exports = unsignedConfig;
