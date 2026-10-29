export const PROMOTIONS_COUPONS_SCREEN = {
  title: 'Promotions & Coupons',
  subtitle: 'Browse offers and copy codes to use at checkout.',
  emptyTitle: 'No promotions yet',
  emptyMessage: 'New coupons will show up here when they become available.',
  retryLabel: 'Retry',
  copyLabel: 'Copy',
  copiedLabel: 'Copied',
  copySuccessTitle: 'Code copied',
  copySuccessMessage: (code: string) => `${code} is ready to paste at checkout.`,
  expiresPrefix: 'Valid till',
  startsPrefix: 'Starts',
  minAmountPrefix: 'Min. booking',
  maxDiscountPrefix: 'Up to',
  pointsCreditHint: 'Wallet credit',
  inactiveLabel: 'Inactive',
} as const;

export const formatCouponRideTypeLabel = (scope: string | null | undefined): string => {
  const value = String(scope ?? '')
    .trim()
    .toUpperCase();
  switch (value) {
    case 'REGULAR':
      return 'Regular rides';
    case 'ASSURED':
      return 'Assured rides';
    case 'OFFICE_COMMUTE':
      return 'Office commute';
    case 'ALL':
      return 'All ride types';
    default:
      return value ? value.replace(/_/g, ' ') : 'All ride types';
  }
};

export const formatCouponChargeScopeLabel = (scope: string | null | undefined): string => {
  const value = String(scope ?? '')
    .trim()
    .toUpperCase();
  switch (value) {
    case 'RIDE_FARE':
      return 'Ride fare';
    case 'ASSURED_SECURITY_DEPOSIT':
      return 'Assured deposit';
    case 'BOTH':
      return 'Fare & deposit';
    default:
      return value ? value.replace(/_/g, ' ') : 'Ride fare';
  }
};
