export const COMMUTE_SERIES_COPY = {
  publishWeekdayTitle: 'Publishing day stays included',
  publishWeekdayMessage:
    'The publishing date cannot be excluded from a recurring commute. That weekday stays selected so the first occurrence is created.',
  missingReturnTimeTitle: 'Return time required',
  missingReturnTimeMessage:
    'Select a return departure time. Same-day returns must leave after the outbound ride.',
  returnTimeOrderTitle: 'Return time too early',
  returnTimeOrderMessage:
    'Return departure must be later than the outbound departure. Overnight returns are not supported.',
  missingReturnRouteTitle: 'Select a return route',
  missingReturnRouteMessage:
    'Choose a driving route from office back home. The outbound route cannot be reused.',
  editScopeTitle: 'Apply this change',
  editScopeMessage:
    'This ride is part of a recurring commute. Future changes apply only to this direction (outbound or return), not the opposite trip.',
  editThisOnly: 'This ride only',
  editThisAndFuture: 'This and future',
  cancelScopeTitle: 'Cancel recurring ride',
  cancelScopeMessage:
    'This ride only cancels the selected occurrence. This and future cancels both outbound and return occurrences on this date and later dates. Booked future rides and trips already in progress are left unchanged.',
  cancelThisOnly: 'This ride only',
  cancelThisAndFuture: 'This and future',
  keepRide: 'Keep ride',
  inProgressTitle: 'Trip in progress',
  inProgressMessage:
    'This trip is already in progress, so it cannot be cancelled as a series from this occurrence. Finish the trip, or cancel a later occurrence instead.',
  skippedBookedTitle: 'Some rides kept',
  skippedBookedMessage: (skippedCount: number, cancelledCount: number): string => {
    const skipped =
      skippedCount === 1
        ? '1 future ride could not be cancelled because it already has bookings'
        : `${skippedCount} future rides could not be cancelled because they already have bookings`;
    if (cancelledCount > 0) {
      return `${skipped}. ${cancelledCount} unbooked ${
        cancelledCount === 1 ? 'ride was' : 'rides were'
      } cancelled.`;
    }
    return `${skipped}. No other rides were cancelled.`;
  },
  skippedIneligibleMessage: (skippedCount: number, cancelledCount: number): string => {
    const skipped =
      skippedCount === 1
        ? '1 trip was not cancelled because it is already in progress'
        : `${skippedCount} trips were not cancelled because they are already in progress`;
    if (cancelledCount > 0) {
      return `${skipped}. ${cancelledCount} unbooked ${
        cancelledCount === 1 ? 'ride was' : 'rides were'
      } cancelled.`;
    }
    return `${skipped}. No other rides were cancelled.`;
  },
  returnRouteTitle: 'Select return route',
  returnRouteSubtitle:
    'Choose the driving route from office back home. This is a separate route from the outbound trip.',
  returnTimeLabel: 'Return departure',
} as const;
