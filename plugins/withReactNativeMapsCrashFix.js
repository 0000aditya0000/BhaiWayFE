const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');

/**
 * Expo Config Plugin to ensure react-native-maps iOS native crash fix is applied
 * during `npx expo prebuild` and EAS Build.
 *
 * Fixes: EXC_CRASH (SIGABRT): *** -[__NSArrayM insertObject:atIndex:]: object cannot be nil
 * in -[AIRMap insertReactSubview:atIndex:] (AIRMap.m:138).
 */
module.exports = function withReactNativeMapsCrashFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      try {
        const patchScript = path.resolve(
          modConfig.modRequest.projectRoot,
          'scripts',
          'patch-react-native-maps.js',
        );
        require(patchScript);
      } catch (err) {
        console.warn(
          '[withReactNativeMapsCrashFix] Warning: Could not run patch-react-native-maps:',
          err,
        );
      }
      return modConfig;
    },
  ]);
};

