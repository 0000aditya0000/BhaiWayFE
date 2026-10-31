export const SOS_COPY = {
  confirmTitle: 'Are you sure you want to trigger an emergency SOS?',
  confirmMessage:
    'Your driver, co-passengers and BhaiWay Safety Team will be alerted.',
  confirmCancel: 'Cancel',
  confirmTrigger: 'Trigger SOS',
  successTitle: 'SOS triggered',
  successMessage:
    'SOS successfully triggered. BhaiWay Safety Team and your ride participants have been alerted.',
  attachedTitle: 'Emergency already registered',
  attachedMessage:
    'An SOS is already active for this ride. BhaiWay Safety Team and ride participants remain alerted.',
  passengerAlertTitle: 'Emergency SOS triggered',
  passengerAlertMessage:
    'A passenger has triggered an SOS in your current ride. Please stay alert and follow safety instructions.',
  driverAlertTitle: 'SOS TRIGGERED FOR YOUR RIDE',
  driverExitLabel: 'Exit SOS Mode',
  driverRideLabel: 'Ride',
  driverTimeLabel: 'Emergency time',
  driverUnknownPassenger: 'A passenger',
  statusActive: 'SOS active — BhaiWay Safety Team has been alerted.',
  statusResolved: 'SOS resolved',
  notEligibleTitle: 'SOS unavailable',
  locationDenied:
    'Location permission is off. SOS can still be sent, but your live position will not be shared.',
} as const;

export const DRIVER_ALERT_DURATION_MS = 30_000;
export const SOS_LOCATION_MIN_MS = 4000;
export const SOS_LOCATION_MIN_METERS = 12;
export const SOS_RECOVER_DEBOUNCE_MS = 400;
