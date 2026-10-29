export type PaymentMethodId =
  | 'wallet'
  | 'gpay'
  | 'phonepe'
  | 'visa'
  | 'pay-after-ride'
  | (string & {});

export type PaymentMethodKind = 'wallet' | 'upi' | 'card' | 'pay-after';

export interface PaymentMethodOption {
  id: PaymentMethodId;
  kind: PaymentMethodKind;
  label: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
}

export interface PaymentBankOption {
  id: string;
  label: string;
  color: string;
}

export interface BookedRideDetails {
  rideId: string;
  bookingId?: string;
  rideType: 'regular' | 'assured';
  driverName: string;
  driverSubtitle: string;
  pickup: string;
  dropoff: string;
  vehicle: string;
  plateNumber: string;
  dateTimeLabel: string;
  meetTimeLabel: string;
  seats?: number;
  fareTotal?: number;
  pricePerSeat?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  bookingStatus?: string;
  /** Assured: backend security deposit amount (display number). */
  securityDepositAmount?: number;
  securityDepositStatus?: string;
  securityDepositPercentage?: number;
  /** Assured: fare amount from fareAmount (preferred) or totalAmount. */
  fareAmount?: number;
  farePayment?: string;
  farePaymentStatus?: string;
}
