module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // In a monorepo, `babel-preset-expo` lives at the workspace root but
      // `expo-router` is nested under apps/mobile/node_modules — so the preset's
      // `hasModule('expo-router')` resolution fails and the plugin that inlines
      // `EXPO_ROUTER_APP_ROOT` never runs. Apply it explicitly here.
      require('babel-preset-expo/build/expo-router-plugin').expoRouterBabelPlugin,
    ],
  };
};
