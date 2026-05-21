const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package.json "exports" field resolution (required for Firebase 10+).
// Without this, Metro falls back to the Node.js CJS bundle of Firebase which
// doesn't resolve in a browser/RN context.
config.resolver.unstable_enablePackageExports = true;

// Prefer react-native → browser bundles over Node.js bundles.
// This ensures Firebase uses its browser bundle on web and RN bundle on device.
config.resolver.unstable_conditionNames = [
  'react-native',
  'browser',
  'require',
  'default',
];

module.exports = config;
