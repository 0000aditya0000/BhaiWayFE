import type { MasterProfileData, ProfileMenuItem } from '../types';

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
  emailLabel: 'Email',
  emailVerifiedLabel: 'Verified',
  emailUnverifiedLabel: 'Not verified',
  verifyEmailLabel: 'Verify',
  addEmailLabel: 'Add email',
  emailMissingLabel: 'No email on file',
  changeEmailLabel: 'Change Email',
} as const;

export const DEFAULT_PROFILE_AVATAR = '';

export const DEFAULT_MASTER_PROFILE: MasterProfileData = {
  fullName: 'User',
  phoneLabel: '',
  email: null,
  emailVerified: false,
  avatarUri: DEFAULT_PROFILE_AVATAR,
  walletBalanceLabel: '0 Coins',
  paymentMethodsSubtitle: 'UPI, Cards linked',
  driverEarningsLabel: '0',
  earningBreakdown: [
    { label: 'Regular Rides', amountLabel: '0' },
    { label: 'Assured Rides', amountLabel: '0' },
    { label: 'Office Commute', amountLabel: '0' },
  ],
  earningInsight: '',
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
    id: 'editProfile',
    title: 'Edit Profile',
    subtitle: 'Update name, email, photo & gender',
    icon: 'person-outline',
  },
  {
    id: 'ratings',
    title: 'Ratings & Reviews',
    subtitle: 'See your average rating and feedback',
    icon: 'star-outline',
  },
  {
    id: 'verify',
    title: 'Verify Your Identity',
    subtitle: 'Aadhaar or corporate email verification',
    icon: 'id-card-outline',
  },
  {
    id: 'garage',
    title: 'My Garage',
    subtitle: 'Manage your vehicles',
    icon: 'car-outline',
  },
  {
    id: 'promotions',
    title: 'Promotions & Coupons',
    subtitle: 'View offers and copy coupon codes',
    icon: 'pricetag-outline',
  },
  {
    id: 'refer',
    title: 'Referrals & Rewards',
    subtitle: 'Invite friends and track driver rewards',
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
