/**
 * EAS Build hook — copy Firebase client configs from file secrets before prebuild.
 * Configure in Expo dashboard / eas.json env:
 *   GOOGLE_SERVICES_JSON          → path to Android google-services.json secret
 *   GOOGLE_SERVICE_INFO_PLIST     → path to iOS GoogleService-Info.plist secret
 *
 * Also mirrored in app.config.js; this runs earlier so the files exist on disk
 * for any tooling that scans the project root before config evaluation.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const copyIfPresent = (envName, destRelative) => {
  const source = typeof process.env[envName] === 'string' ? process.env[envName].trim() : '';
  if (!source) {
    return;
  }
  if (!fs.existsSync(source)) {
    console.warn(`[eas-build-pre-install] $${envName} set but file missing: ${source}`);
    return;
  }
  const dest = path.join(root, destRelative);
  fs.copyFileSync(source, dest);
  console.log(`[eas-build-pre-install] Wrote ${destRelative} from $${envName}`);
};

copyIfPresent('GOOGLE_SERVICES_JSON', 'google-services.json');
copyIfPresent('GOOGLE_SERVICES_JSON_PATH', 'google-services.json');
copyIfPresent('GOOGLE_SERVICE_INFO_PLIST', 'GoogleService-Info.plist');
copyIfPresent('GOOGLE_SERVICES_PLIST', 'GoogleService-Info.plist');
