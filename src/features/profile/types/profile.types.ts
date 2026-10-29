export type ProfileMenuActionId =
  | 'editProfile'
  | 'ratings'
  | 'verify'
  | 'garage'
  | 'promotions'
  | 'refer'
  | 'safety'
  | 'support'
  | 'legal';

export interface ProfileBadge {
  id: string;
  label: string;
  icon: 'verified' | 'close-circle' | 'star' | 'shield-checkmark';
  tone: 'success' | 'danger' | 'neutral' | 'primary';
  pressable?: boolean;
}

export interface ProfileMenuItem {
  id: ProfileMenuActionId;
  title: string;
  subtitle: string;
  icon:
    | 'person-outline'
    | 'star-outline'
    | 'id-card-outline'
    | 'car-outline'
    | 'pricetag-outline'
    | 'gift-outline'
    | 'shield-outline'
    | 'headset-outline'
    | 'document-text-outline';
}

export interface MyRatingReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAtLabel: string;
  reviewerName: string;
  reviewerPhoto: string | null;
  rideLabel: string | null;
  roleLabel: string | null;
  contextLabel: string;
}

export type MyRatingsDirection = 'received' | 'given';

export interface DriverEarningBreakdown {
  label: string;
  amountLabel: string;
}

export interface MasterProfileData {
  fullName: string;
  phoneLabel: string;
  email: string | null;
  emailVerified: boolean;
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
