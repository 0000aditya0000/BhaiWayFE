import type { CommuteBookingFare } from '../../types/commute-review-booking.types';

export interface CommutePaymentSummaryProps {
  fare: CommuteBookingFare;
  selectedSeats: number;
  maxSeats: number;
  /** Server-preview discount points (0 when none). */
  promoDiscount?: number;
  /** Payable after coupon — defaults to fare.total when omitted. */
  payableTotal?: number;
  onDecrementSeats: () => void;
  onIncrementSeats: () => void;
}
