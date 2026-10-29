import { ROUTES } from '@/config';

export const OFFER_RIDE_PAYMENT_SCREEN = {
  title: 'Payment Options',
  continueLabel: 'Pay Deposit & Publish',
  secureLabel: 'PCI-DSS SECURE PAYMENT',
  depositNoticeTitle: 'Assured driver deposit',
  depositNoticeBody:
    'The deposit is held from your BhaiWay Coins wallet when you publish. The backend creates the hold — no local debit.',
  missingVehicleTitle: 'Select a vehicle',
  missingVehicleMessage: 'Please choose a vehicle before publishing.',
} as const;

export const getOfferRidePaymentPath = () => ROUTES.offerRidePayment;
