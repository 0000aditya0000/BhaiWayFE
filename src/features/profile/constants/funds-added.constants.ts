export const FUNDS_ADDED_SCREEN = {
  brandTitle: 'BhaiWay',
  title: 'Funds Added Successfully!',
  subtitle: 'Your wallet balance has been updated. You can now use this for your next commute.',
  statusLabel: 'Current Status',
  statusTitle: 'New Balance',
  updatedLabel: 'Updated',
  goToWalletLabel: 'Go to Wallet',
  continueBookingLabel: 'Continue Booking',
  bookRideLabel: 'Book a Ride',
  receiptLabel: 'View Transaction Receipt',
  defaultAmountLabel: '1,000',
  defaultBalanceLabel: '0',
} as const;

export const getFundsAddedPath = (params: {
  amountLabel?: string;
  balanceLabel?: string;
  amountCoins?: string;
}) => ({
  pathname: '/funds-added' as const,
  params: {
    amountLabel: params.amountLabel ?? '',
    balanceLabel: params.balanceLabel ?? '',
    amountCoins: params.amountCoins ?? '',
  },
});
