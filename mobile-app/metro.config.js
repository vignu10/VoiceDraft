const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Explicitly set the project root to __dirname (mobile-app directory)
const config = getDefaultConfig(__dirname);

// Ensure the project root is set correctly
config.projectRoot = __dirname;

// Add watch folders if needed (for monorepo)
config.watchFolders = [
  // Only watch the mobile-app directory
  __dirname
];

// Add resolver for @/ imports - fix for EAS builds
const { resolver: defaultResolver } = config;
config.resolver = {
  ...defaultResolver,
  alias: {
    ...(defaultResolver.alias || {}),
    '@': path.resolve(__dirname),
  },
  assetExts: [...defaultResolver.assetExts, 'svg'],
  sourceExts: [...defaultResolver.sourceExts, 'mjs', 'cjs'],
};

module.exports = config;
