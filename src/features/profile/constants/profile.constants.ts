import type { MasterProfileData, ProfileMenuItem } from '../types';
import { WALLET_BALANCE_LABEL } from './wallet-shared.constants';

export const PROFILE_SCREEN = {
  title: 'Profile',
  walletTitle: 'BhaiWay Coins Wallet',
  addRedeemLabel: 'Open Wallet',
  paymentMethodsTitle: 'Payment Methods',
  driverEarningsTitle: 'Driver Earnings',
  earningInsightPrefix: 'Earning Insight:',
  logOutLabel: 'Log Out',
  logOutTitle: 'Log Out',
  logOutMessage: 'Are you sure you want to log out of your BhaiWay account?',
  logOutConfirm: 'Log Out',
  logOutCancel: 'Cancel',
  comingSoonTitle: 'Coming Soon',
  comingSoonMessage: 'This feature will be available soon.',
  versionLabel: 'Version 2.4.1 (Build 890)',
  changePhotoTitle: 'Profile Photo',
  changePhotoSubtitle: 'Take a new photo or choose one from your gallery.',
} as const;

export const DEFAULT_PROFILE_AVATAR = '';

export const DEFAULT_MASTER_PROFILE: MasterProfileData = {
  fullName: 'User',
  phoneLabel: '',
  avatarUri: DEFAULT_PROFILE_AVATAR,
  walletBalanceLabel: WALLET_BALANCE_LABEL,
  paymentMethodsSubtitle: 'UPI, Cards linked',
  driverEarningsLabel: '2,450',
  earningBreakdown: [
    { label: 'Regular Rides', amountLabel: '1,850' },
    { label: 'Assured Rides', amountLabel: '600' },
  ],
  earningInsight:
    "You earned 600 from Assured Rides. If your Regular Rides had been 'Assured', you could have earned an additional 450!",
  badges: [
    { id: 'corporate', label: 'Corporate ID', icon: 'close-circle', tone: 'danger' },
    { id: 'rating', label: '0', icon: 'star', tone: 'neutral' },
    { id: 'trust', label: '98% Trust', icon: 'shield-checkmark', tone: 'primary' },
  ],
  ratingLabel: '0',
  trustLabel: '98% Trust',
};

export const PROFILE_MENU_ITEMS: readonly ProfileMenuItem[] = [
  {
    id: 'verify',
    title: 'Verify Your Identity',
    subtitle: 'Verify Aadhaar to unlock trust & features',
    icon: 'id-card-outline',
  },
  {
    id: 'garage',
    title: 'My Garage',
    subtitle: 'Manage your vehicles',
    icon: 'car-outline',
  },
  {
    id: 'refer',
    title: 'Refer & Earn',
    subtitle: 'Invite coworkers, earn fuel credits',
    icon: 'gift-outline',
  },
  {
    id: 'safety',
    title: 'Safety Hub',
    subtitle: 'Trusted contacts, SOS, emergency help',
    icon: 'shield-outline',
  },
  {
    id: 'support',
    title: 'Help & Support',
    subtitle: '24/7 assistance available',
    icon: 'headset-outline',
  },
  {
    id: 'legal',
    title: 'Legal Details',
    subtitle: 'Terms, Privacy, Policies',
    icon: 'document-text-outline',
  },
] as const;
