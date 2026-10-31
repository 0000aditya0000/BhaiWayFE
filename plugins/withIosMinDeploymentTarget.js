const { withPodfile } = require('@expo/config-plugins');

const MARKER = "config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'";

const HOOK = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        current = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || current.to_f < 15.0
          ${MARKER}
        end
      end
    end
`;

module.exports = function withIosMinDeploymentTarget(config) {
  return withPodfile(config, (podfileConfig) => {
    const contents = podfileConfig.modResults.contents;

    if (contents.includes(MARKER)) {
      return podfileConfig;
    }

    const needle = `react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
      :ccache_enabled => ccache_enabled?(podfile_properties),
    )`;

    if (!contents.includes(needle)) {
      throw new Error(
        'Could not find react_native_post_install in the iOS Podfile.',
      );
    }

    podfileConfig.modResults.contents = contents.replace(
      needle,
      `${needle}\n${HOOK}`,
    );

    return podfileConfig;
  });
};
