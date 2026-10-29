import type { LegalPolicyItem } from '../types';

export const LEGAL_SCREEN = {
  title: 'Legal & Policies',
  heroTitle: 'Transparency & Safety',
  heroSubtitle:
    'BhaiWay is built on trust. Review our policies to understand how we protect your rights and maintain a professional community.',
  versionLabel: 'BhaiWay Version 2.4.0 (2024)',
  copyrightLabel: '© 2024 BhaiWay Technologies Inc. All rights reserved.',
  openFailedTitle: 'Unable to open',
  openFailedMessage: 'Please check your internet connection and try again.',
} as const;

export const LEGAL_POLICY_ITEMS: readonly LegalPolicyItem[] = [
  {
    id: 'userAgreement',
    title: 'User Agreement',
    subtitle: 'Rules for using BhaiWay as a rider',
    url: 'https://www.bhaiway.com/user-agreement',
    icon: 'document-text-outline',
  },
  {
    id: 'driverAgreement',
    title: 'Driver Agreement',
    subtitle: 'Rules for offering rides on BhaiWay',
    url: 'https://www.bhaiway.com/driver-agreement',
    icon: 'car-outline',
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    subtitle: 'How we handle your data',
    url: 'https://www.bhaiway.com/privacy',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'terms',
    title: 'Terms and Conditions',
    subtitle: 'General terms of use',
    url: 'https://www.bhaiway.com/terms-condition',
    icon: 'reader-outline',
  },
] as const;
