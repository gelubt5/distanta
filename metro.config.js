const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add extensions for web assets
config.resolver.assetExts.push('html', 'css', 'txt', 'woff2', 'woff');

module.exports = config;
