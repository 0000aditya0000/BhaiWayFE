export const COMMUTE_PAYMENT_SCREEN = {
  title: 'Payment',
  continueLabel: 'Pay & Request Ride',
  secureLabel: 'Your payment is secured with bank-grade encryption.',
  fareTitle: 'Commute fare',
  perSeatLabel: (amount: string) => `${amount} per seat`,
  totalLabel: 'Total payable now',
  walletLabel: 'Wallet balance',
} as const;

export const getCommutePaymentPath = (params: {
  rideId: string;
  seats: number;
  riderPricePerSeat: number;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  couponCode?: string | null;
  couponChargeScope?: 'RIDE_FARE' | 'ASSURED_SECURITY_DEPOSIT' | null;
  couponDiscount?: string | null;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}) => ({
  pathname: '/office-commute/payment' as const,
  params: {
    rideId: params.rideId,
    seats: String(Math.max(1, Math.floor(params.seats))),
    riderPricePerSeat: String(params.riderPricePerSeat),
    origin: params.origin ?? '',
    destination: params.destination ?? '',
    driverName: params.driverName ?? '',
    carModel: params.carModel ?? '',
    couponCode: params.couponCode?.trim().toUpperCase() ?? '',
    couponChargeScope: params.couponChargeScope ?? '',
    couponDiscount: params.couponDiscount?.trim() ?? '',
    originLat: params.originLat != null ? String(params.originLat) : '',
    originLng: params.originLng != null ? String(params.originLng) : '',
    destinationLat: params.destinationLat != null ? String(params.destinationLat) : '',
    destinationLng: params.destinationLng != null ? String(params.destinationLng) : '',
  },
});
