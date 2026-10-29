import type {
  BookedRideDetails,
  PaymentBankOption,
  PaymentMethodOption,
  RideType,
} from '../types';

export const PAYMENT_SCREEN = {
  title: 'Payment Options',
  walletTitle: 'BhaiWay Coins',
  addCoinsLabel: 'Add BhaiWay Coins',
  payAfterTitle: 'Pay After Ride',
  secureLabel: 'PCI-DSS SECURE PAYMENT',
  continueLabel: 'Continue',
  continueAssuredFeeLabel: 'Pay Assured Fee & Book',
  continueAssuredDepositLabel: 'Confirm Assured Booking',
  assuredFeeNoticeTitle: 'Assured deposit due now',
  assuredFeeNoticeBody:
    'The Assured security deposit is held from your BhaiWay Coins wallet when you confirm. Ride fare is paid separately.',
  payAfterAssuredSubtitle:
    'Pay ride fare after the trip. Assured fee is charged now from your BhaiWay Coins wallet.',
  assuredHeading: 'Assured Ride',
  assuredDepositTitle: 'Security Deposit',
  assuredDepositMandatory: 'Mandatory · Held in wallet',
  assuredDepositHint: 'Required to confirm your Assured ride. This is a wallet hold, not fare payment.',
  assuredPenaltyPreviousCancellationMessage: (percentage: number) =>
    `Your security deposit is ${percentage}% for this ride because you cancelled your previous Assured ride.`,
  assuredPenaltyNextBookingOnly:
    'This applies to your next Assured booking only.',
  assuredWalletBalanceLabel: 'Wallet Balance',
  assuredFareTitle: 'Ride Fare',
  assuredFareChoiceTitle: 'How would you like to pay your fare?',
  assuredPayNowLabel: 'Pay Now',
  assuredPayNowSubtitle: (amount: string) => `Pay ${amount} before your trip`,
  assuredPayLaterLabel: 'Pay After Ride',
  assuredPayLaterSubtitle: 'Pay the fare after completing the ride',
  assuredSummaryTitle: 'Wallet impact now',
  assuredSummaryDeposit: 'Security deposit (hold)',
  assuredSummaryFare: 'Fare payment',
  assuredSummaryFareZero: '₹0 — pay after ride',
  assuredCoveredByWallet: 'Covered by Wallet',
} as const;

export const BOOKED_SCREEN = {
  title: 'Ride Booked Successfully!',
  rideDetailsLabel: 'Ride Details',
  pickupLabel: 'Pickup',
  dropLabel: 'Drop',
  vehicleLabel: 'Vehicle',
  dateTimeLabel: 'Date & Time',
  seatsLabel: 'Seats',
  fareLabel: 'Fare',
  paymentMethodLabel: 'Payment Method',
  paymentStatusLabel: 'Payment Status',
  payAfterRideLabel: 'Pay After Ride',
  unpaidLabel: 'UNPAID',
  paidLabel: 'PAID',
  heldLabel: 'Held',
  securityDepositLabel: 'Security Deposit',
  farePaymentLabel: 'Fare Payment',
  addToCalendarLabel: 'Add to Calendar',
  trackLabel: 'Track My Ride',
  rideDetailsActionLabel: 'Ride Details',
  myRidesLabel: 'My Rides',
  assuredRefundNote:
    'Note: Your Assured security deposit will be released after the trip ends (subject to Assured rules).',
  assuredCancelNote:
    'Note: You have booked an assured ride. If you cancel this ride, the security deposit will not be refunded.',
} as const;

export const WALLET_BALANCE = 450;

export const PAYMENT_METHODS: readonly PaymentMethodOption[] = [
  {
    id: 'wallet',
    kind: 'wallet',
    label: 'BhaiWay Coins Wallet',
    icon: 'wallet',
  },
  {
    id: 'pay-after-ride',
    kind: 'pay-after',
    label: 'Pay After Ride',
    subtitle: 'Pay the driver in BhaiWay Coins after trip completion',
    icon: 'repeat-outline',
  },
] as const;

export const POPULAR_BANKS: readonly PaymentBankOption[] = [
  { id: 'sbi', label: 'SBI', color: '#003366' },
  { id: 'hdfc', label: 'HDFC', color: '#1C3F94' },
  { id: 'icici', label: 'ICICI', color: '#EF3A24' },
] as const;

export const getPaymentPath = (params: {
  rideId: string;
  rideType: RideType;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  /** For Regular: pricePerSeat. For Assured: total due (legacy). */
  price?: number;
  seats?: number;
  assuredFee?: number;
  assuredDepositCoins?: string | null;
  assuredDepositPercentage?: number | null;
  assuredDepositPenaltyNotice?: boolean;
  /** Catalog coupon applied at review — server reapplies on create. */
  couponCode?: string | null;
  couponChargeScope?: 'RIDE_FARE' | 'ASSURED_SECURITY_DEPOSIT' | null;
  /** Preview discount for display only. */
  couponDiscount?: string | null;
  dateLabel?: string;
  departureTime?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}) => ({
  pathname: '/ride-search/payment' as const,
  params: {
    rideId: params.rideId,
    rideType: params.rideType,
    origin: params.origin ?? '',
    destination: params.destination ?? '',
    driverName: params.driverName ?? '',
    carModel: params.carModel ?? '',
    price: params.price != null ? String(params.price) : '',
    seats: params.seats != null ? String(params.seats) : '',
    assuredFee: params.assuredFee != null ? String(params.assuredFee) : '',
    assuredDepositCoins: params.assuredDepositCoins?.trim() ?? '',
    assuredDepositPercentage:
      params.assuredDepositPercentage != null
        ? String(params.assuredDepositPercentage)
        : '',
    assuredDepositPenaltyNotice: params.assuredDepositPenaltyNotice ? '1' : '0',
    couponCode: params.couponCode?.trim().toUpperCase() ?? '',
    couponChargeScope: params.couponChargeScope ?? '',
    couponDiscount: params.couponDiscount?.trim() ?? '',
    dateLabel: params.dateLabel ?? '',
    departureTime: params.departureTime ?? '',
    originLat: params.originLat != null ? String(params.originLat) : '',
    originLng: params.originLng != null ? String(params.originLng) : '',
    destinationLat: params.destinationLat != null ? String(params.destinationLat) : '',
    destinationLng: params.destinationLng != null ? String(params.destinationLng) : '',
  },
});

export const getBookedPath = (params: {
  rideId: string;
  rideType: RideType;
  bookingId?: string;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
  price?: number;
  seats?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}) => ({
  pathname: '/ride-search/booked' as const,
  params: {
    rideId: params.rideId,
    rideType: params.rideType,
    bookingId: params.bookingId ?? '',
    origin: params.origin ?? '',
    destination: params.destination ?? '',
    driverName: params.driverName ?? '',
    carModel: params.carModel ?? '',
    price: params.price != null ? String(params.price) : '',
    seats: params.seats != null ? String(params.seats) : '',
    originLat: params.originLat != null ? String(params.originLat) : '',
    originLng: params.originLng != null ? String(params.originLng) : '',
    destinationLat: params.destinationLat != null ? String(params.destinationLat) : '',
    destinationLng: params.destinationLng != null ? String(params.destinationLng) : '',
  },
});

export const getBookedRideMock = (params: {
  rideId: string;
  rideType: RideType;
  origin?: string;
  destination?: string;
  driverName?: string;
  carModel?: string;
}): BookedRideDetails => ({
  rideId: params.rideId,
  rideType: params.rideType,
  driverName: params.driverName || 'Vikram K.',
  driverSubtitle: 'Altus Mindstream',
  pickup: shortName(params.origin) || 'Saket',
  dropoff: shortName(params.destination) || 'Cyber City',
  vehicle: params.carModel || 'Honda City',
  plateNumber: 'DL 3C AB 1234',
  dateTimeLabel: 'Oct 24, 2023 | 08:45 AM',
  meetTimeLabel: '08:45 AM',
});

const shortName = (value?: string): string => {
  if (!value) {
    return '';
  }
  return value.split(',')[0]?.trim() || value;
};
