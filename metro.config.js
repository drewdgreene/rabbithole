const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure .cjs files are resolved
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
