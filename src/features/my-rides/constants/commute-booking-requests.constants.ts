import { ROUTES } from '@/config';

export const COMMUTE_BOOKING_REQUESTS_SCREEN = {
  title: 'Booking Requests',
  subtitle: 'Review and respond to Daily Office Commute requests.',
  emptyTitle: 'No booking requests',
  emptyMessage: 'New Daily Office Commute requests will appear here.',
  loadingLabel: 'Loading requests…',
  errorTitle: 'Unable to load requests',
  errorRetryLabel: 'Try again',
  groupRequestCount: (count: number) =>
    count === 1 ? '1 Booking Request' : `${count} Booking Requests`,
  availableSeatsLabel: (count: number) =>
    count === 1 ? '1 seat available' : `${count} seats available`,
  rejectConfirmTitle: 'Reject booking request?',
  rejectConfirmMessage: (name: string, seats: number) =>
    `${name} requested ${seats === 1 ? '1 seat' : `${seats} seats`}.`,
  rejectConfirmCancel: 'Cancel',
  rejectConfirmAction: 'Reject Request',
  acceptSuccessTitle: 'Ride request accepted',
  acceptSuccessMessage: (name: string) => `${name} is confirmed for this ride.`,
  rejectSuccessTitle: 'Booking request rejected',
  rejectSuccessMessage: 'The passenger will receive a refund for this request.',
  acceptFailedTitle: 'Unable to accept',
  rejectFailedTitle: 'Unable to reject',
  acceptFailedMessage: 'Please try again.',
  rejectFailedMessage: 'Please try again.',
  insufficientSeatsMessage:
    'Not enough seats available. Another request may have already been accepted.',
  alreadyProcessedMessage: 'This booking request has already been processed.',
  openRideDetailsLabel: 'View ride details',
  myRidesBannerTitle: 'Booking Requests',
  myRidesBannerSubtitle: (count: number) =>
    count === 1 ? '1 pending request needs your review' : `${count} pending requests need your review`,
  myRidesBannerCta: 'Review',
  pendingBadge: (count: number) => String(count),
  autoCancelledMessage: (count: number) =>
    count === 1
      ? '1 other pending request was automatically cancelled and refunded because the ride is now full.'
      : `${count} other pending requests were automatically cancelled and refunded because the ride is now full.`,
} as const;

export const getCommuteBookingRequestsPath = () => ({
  pathname: ROUTES.myRidesBookingRequests as '/my-rides/booking-requests',
});
