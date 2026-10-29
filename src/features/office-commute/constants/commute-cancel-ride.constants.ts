export type CommuteCancelReasonId =
  | 'plan-changed'
  | 'wait-time'
  | 'another-ride'
  | 'driver-not-responding'
  | 'other';

export interface CommuteCancelReasonOption {
  id: CommuteCancelReasonId;
  label: string;
}

export const COMMUTE_CANCEL_RIDE_SCREEN = {
  title: 'Cancel Ride',
  heading: 'Are you sure you want to cancel your ride?',
  subtitle: 'Your office commute booking can be cancelled before the trip starts.',
  rideDetailsLabel: 'Ride Details',
  badge: 'Office Commute',
  policyTitle: 'Cancellation Policy',
  policyText:
    'Office Commute bookings receive a full refund when cancelled. There are no cancellation penalties.',
  reasonTitle: 'Reason for Cancellation',
  otherPlaceholder: 'Please tell us more (optional)',
  confirmLabel: 'Confirm Cancellation',
  reasonRequiredTitle: 'Reason required',
  reasonRequiredMessage: 'Please select a reason for cancellation.',
} as const;

export const COMMUTE_CANCEL_REASONS: readonly CommuteCancelReasonOption[] = [
  { id: 'plan-changed', label: 'Plan changed' },
  { id: 'wait-time', label: 'Wait time too long' },
  { id: 'another-ride', label: 'Found another ride' },
  { id: 'driver-not-responding', label: 'Driver not responding' },
  { id: 'other', label: 'Other' },
] as const;

export const getCommuteCancelRidePath = (params: {
  bookingId: string;
  rideId: string;
  origin?: string;
  destination?: string;
  dateLabel?: string;
  timeLabel?: string;
}) => ({
  pathname: '/office-commute/cancel-ride' as const,
  params: {
    bookingId: params.bookingId,
    rideId: params.rideId,
    origin: params.origin ?? '',
    destination: params.destination ?? '',
    dateLabel: params.dateLabel ?? '',
    timeLabel: params.timeLabel ?? '',
  },
});

export const shortCommutePlaceName = (value?: string): string => {
  if (!value) {
    return '';
  }
  return value.split(',')[0]?.trim() || value;
};
