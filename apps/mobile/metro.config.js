const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  path.resolve(monorepoRoot, 'packages/shared'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
config.transformer.unstable_allowRequireContext = true;
// Force a single React instance — there are sibling workspaces with their own
// react copies (apps/web@18.3.1) that Metro must never resolve from this app.
config.resolver.extraNodeModules = {
  react: path.resolve(monorepoRoot, 'node_modules/react'),
  'react-dom': path.resolve(monorepoRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(monorepoRoot, 'node_modules/react-native'),
};

// Strip `.js` from relative imports inside `packages/shared` so Metro can find
// the `.ts` source. `@glasto/shared` is authored as TS-with-`.js`-extensions
// (the NodeNext/ESM convention) and the web app's bundler handles this natively.
const sharedRoot = path.resolve(monorepoRoot, 'packages/shared');
const upstreamResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    context.originModulePath.startsWith(sharedRoot) &&
    moduleName.startsWith('.') &&
    moduleName.endsWith('.js')
  ) {
    const stripped = moduleName.slice(0, -3);
    return context.resolveRequest(context, stripped, platform);
  }
  if (upstreamResolver) return upstreamResolver(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
