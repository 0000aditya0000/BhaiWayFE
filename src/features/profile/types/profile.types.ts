export type ProfileMenuActionId =
  | 'verify'
  | 'garage'
  | 'refer'
  | 'safety'
  | 'support'
  | 'legal';

export interface ProfileBadge {
  id: string;
  label: string;
  icon: 'verified' | 'close-circle' | 'star' | 'shield-checkmark';
  tone: 'success' | 'danger' | 'neutral' | 'primary';
}

export interface ProfileMenuItem {
  id: ProfileMenuActionId;
  title: string;
  subtitle: string;
  icon:
    | 'id-card-outline'
    | 'car-outline'
    | 'gift-outline'
    | 'shield-outline'
    | 'headset-outline'
    | 'document-text-outline';
}

export interface DriverEarningBreakdown {
  label: string;
  amountLabel: string;
}

export interface MasterProfileData {
  fullName: string;
  phoneLabel: string;
  avatarUri: string | null;
  walletBalanceLabel: string;
  paymentMethodsSubtitle: string;
  driverEarningsLabel: string;
  earningBreakdown: readonly DriverEarningBreakdown[];
  earningInsight: string;
  badges: readonly ProfileBadge[];
  ratingLabel: string;
  trustLabel: string;
}
