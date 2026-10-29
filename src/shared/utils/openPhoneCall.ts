import { Linking } from 'react-native';

import { toTelHref } from './telHref';

export { toTelHref } from './telHref';

export const openPhoneCall = async (raw: string | null | undefined): Promise<boolean> => {
  const href = raw ? toTelHref(raw) : null;
  if (!href) {
    return false;
  }
  try {
    await Linking.openURL(href);
    return true;
  } catch {
    return false;
  }
};
