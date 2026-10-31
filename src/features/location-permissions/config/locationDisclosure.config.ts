import { Platform } from 'react-native';

import {
  ANDROID_DISCLOSURE_CONFIG,
  IOS_DISCLOSURE_CONFIG,
  type DisclosureConfig,
} from './locationDisclosure.constants';

export * from './locationDisclosure.constants';

export const getPlatformDisclosureConfig = (): DisclosureConfig => {
  return Platform.OS === 'ios' ? IOS_DISCLOSURE_CONFIG : ANDROID_DISCLOSURE_CONFIG;
};
