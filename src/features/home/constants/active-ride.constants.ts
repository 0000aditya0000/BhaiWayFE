export const ACTIVE_RIDE_COPY = {
  liveLabel: 'Live',
  drivingLabel: 'Driving',
  ridingLabel: 'Riding',
  goToRideLabel: 'Go To Ride',
  collapseLabel: 'Hide trip details',
  closeLabel: 'Close',
  expandLabel: 'Show trip details',
  selectRideLabel: 'Select active ride',
  multipleLabel: (count: number): string =>
    count === 1 ? '1 active ride' : `${count} active rides`,
  fareLabel: 'Your fare',
  totalFareLabel: 'Trip fare',
  passengersLabel: 'Passengers',
  otpLabel: 'Pickup OTP',
  sourceLabel: 'From',
  destinationLabel: 'To',
  missingIdTitle: 'Unable to open ride',
  missingPassengerIdMessage:
    'This booking is missing an ID. Pull to refresh and try again.',
  missingDriverIdMessage: 'This ride is missing an ID. Pull to refresh and try again.',
  navigationFailedTitle: 'Unable to open ride',
  navigationFailedMessage: 'Please try again from My Rides.',
} as const;

export const ACTIVE_RIDE_TYPE_LABELS = {
  REGULAR: 'Regular',
  ASSURED: 'Assured',
  COMMUTE: 'Commute',
} as const;

/** Layout tokens so the floating card stays in its own dock, not over home cards. */
export const ACTIVE_RIDE_LAYOUT = {
  collapsedHeight: 64,
  expandedDetailsMaxHeight: 360,
  /** Space under the pill inside the reserved dock (above the home indicator). */
  bottomGap: 20,
  /** Narrower than home category cards so this reads as a sheet, not another service card. */
  horizontalInset: 16,
  zIndex: 20,
  animationMs: 280,
  fetchDedupeMs: 800,
  /** Expanded sheet never covers more than this share of the home viewport. */
  expandedMaxScreenRatio: 0.48,
} as const;

/** Viewport reserved so Office Commute / footer never sit under the collapsed pill. */
export const getActiveRideDockHeight = (): number =>
  ACTIVE_RIDE_LAYOUT.collapsedHeight + ACTIVE_RIDE_LAYOUT.bottomGap;
