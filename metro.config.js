const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

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

// The npm 'assert' v2.x package (pulled in by expo-notifications deps) has
// internal relative requires like './internal/errors' that Metro on Windows
// fails to resolve when unstable_enablePackageExports is active.
// The files exist on disk but Metro's resolver can't find them via its normal
// extension-probing loop in this directory structure.
// Intercept those requires and hand Metro the exact file path directly.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.startsWith('./internal/') &&
    context.originModulePath.replace(/\\/g, '/').includes('/node_modules/assert/')
  ) {
    const candidate = path.resolve(
      path.dirname(context.originModulePath),
      moduleName + '.js',
    );
    if (fs.existsSync(candidate)) {
      return { filePath: candidate, type: 'sourceFile' };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
