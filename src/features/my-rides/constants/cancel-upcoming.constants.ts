import { ROUTES } from '@/config';
import type { AppMode } from '@/store';

export type CancelRideReasonId =
  | 'plan-changed'
  | 'wait-time'
  | 'found-another'
  | 'driver-not-responding'
  | 'other';

export interface CancelRideReasonOption {
  id: CancelRideReasonId;
  label: string;
}

export const CANCEL_UPCOMING_RIDE_SCREEN = {
  title: 'Cancel Ride',
  heading: 'Are you sure you want to cancel your ride?',
  headingDrivingAssured: 'Cancel Assured Ride?',
  subtitleRiding: 'Your ride is currently confirmed and the driver is on their way.',
  subtitleDriving:
    'Your ride is currently scheduled and passengers may be booked.',
  subtitleDrivingAssured:
    'Your security deposit will be forfeited if you cancel this ride.',
  rideDetailsLabel: 'Ride Details',
  assuredBadge: 'Assured',
  commuteBadge: 'Office Commute',
  regularBadge: 'Regular',
  scheduleIconLabel: 'Schedule',
  policyTitle: 'Cancellation Policy',
  policyAssured:
    'Note: This is an Assured Ride. Your security deposit will be forfeited if you cancel.',
  policyAssuredPassengerDetail:
    'If you paid fare upfront (PAY NOW), your fare is also non-refundable. Your next Assured booking may require a higher security deposit.',
  policyRegular:
    'Note: This is a Regular Ride. No Assured booking fee applies. Refunds follow BhaiWay cancellation policy based on timing.',
  policyDriving: 'Note: Riders with confirmed seats will receive a cancellation update.',
  policyDrivingAssured:
    'This ride will be cancelled. Confirmed passengers will be notified.',
  policyCommutePassenger:
    'Office Commute bookings receive a full refund when cancelled. There are no cancellation penalties.',
  policyCommuteDriver:
    'This commute ride will be cancelled. All confirmed passengers will receive a full refund.',
  policyDrivingCommute:
    'This commute ride will be cancelled. All paid passenger bookings will be fully refunded.',
  reasonTitle: 'Reason for Cancellation',
  reasonRequiredTitle: 'Reason required',
  reasonRequiredMessage: 'Please select a reason for cancellation.',
  otherPlaceholder: 'Please tell us more (optional)',
  keepLabel: 'Keep Ride',
  confirmLabel: 'Confirm Cancellation',
  confirmLabelCancelRide: 'Cancel Ride',
  noteLabel: 'Note',
  noteRiding: 'Any paid amount will be refunded as per cancellation policy.',
  noteDriving: 'Riders with confirmed seats will receive a cancellation update.',
} as const;

export const CANCEL_RIDE_REASONS: readonly CancelRideReasonOption[] = [
  { id: 'plan-changed', label: 'Plan changed' },
  { id: 'wait-time', label: 'Wait time too long' },
  { id: 'found-another', label: 'Found another ride' },
  { id: 'driver-not-responding', label: 'Driver not responding' },
  { id: 'other', label: 'Other' },
] as const;

export const CANCEL_UPCOMING_CONFIRMED_SCREEN = {
  title: 'Ride Cancelled',
  heading: 'Ride cancelled',
  subtitleRiding: 'Your upcoming ride has been cancelled successfully.',
  subtitleDriving: 'Your published ride has been cancelled. Riders have been notified.',
  backLabel: 'Back to My Rides',
} as const;

export const getCancelUpcomingRidePath = (params: {
  rideId: string;
  dateLabel: string;
  title: string;
  pickupLabel: string;
  dropoffLabel: string;
  mode: AppMode;
  assured?: boolean;
  commute?: boolean;
  seriesId?: string | null;
}) => ({
  pathname: ROUTES.myRidesCancel,
  params: {
    rideId: params.rideId,
    dateLabel: params.dateLabel,
    title: params.title,
    pickupLabel: params.pickupLabel,
    dropoffLabel: params.dropoffLabel,
    mode: params.mode,
    assured: params.assured ? '1' : '0',
    commute: params.commute ? '1' : '0',
    seriesId: params.seriesId?.trim() || '',
  },
});
