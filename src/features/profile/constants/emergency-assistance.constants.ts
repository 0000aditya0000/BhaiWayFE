import type { EmergencyContact, EmergencyRideSummary } from '../types';

export const EMERGENCY_ASSISTANCE_SCREEN = {
  title: 'EMERGENCY ASSISTANCE',
  exitLabel: 'EXIT',
  sosLabel: 'SOS',
  sosHint: 'Press 3 times to alert emergency services and our 24/7 security team',
  holdingLabel: 'HOLDING...',
  rideSectionLabel: 'Active Ride Details',
  rideStatusLabel: 'IN PROGRESS',
  noActiveRideLabel: 'NO ACTIVE RIDE',
  riderCounterpartLabel: 'Driver',
  driverCounterpartLabel: 'Passenger',
  locationLabel: 'Current Location',
  mapLabel: 'MAP',
  contactsHeading: 'EMERGENCY CONTACTS',
  tipsTitle: 'Safety Tips',
  alertTriggeredTitle: 'Emergency Alert Triggered',
  alertTriggeredMessage:
    'Authorities and the BhaiWay security team have been notified. Stay safe and wait for help.',
  mapTitle: 'Live Map',
  mapMessage: 'Live emergency map sharing will be available soon.',
  alarmTitle: 'Security Alert Sent',
  alarmMessage: 'BhaiWay security has been notified of your emergency.',
  callFailedTitle: 'Unable to place call',
  callFailedMessage: 'Please dial the emergency number directly from your phone.',
  holdDurationMs: 3000,
  tapWindowMs: 2000,
  tapsRequired: 3,
} as const;

export const EMPTY_EMERGENCY_RIDE: EmergencyRideSummary = {
  hasActiveRide: false,
  rideId: null,
  role: null,
  driverName: 'No active ride',
  vehicleLabel: '—',
  plateNumber: '—',
  locationLabel: 'Start or join a ride to see live trip details here.',
  avatarUri: '',
  statusLabel: 'NONE',
};

/** @deprecated Use EMPTY_EMERGENCY_RIDE. */
export const DEFAULT_EMERGENCY_RIDE = EMPTY_EMERGENCY_RIDE;

export const EMERGENCY_TIPS = [
  'Stay inside the vehicle if it is safe to do so. Lock the doors until help arrives.',
  'Your live location is being shared with our security dispatch team automatically.',
  'If you are in immediate danger, exit the vehicle and move to a well-lit public area.',
] as const;

export const EMERGENCY_CONTACTS: readonly EmergencyContact[] = [
  {
    id: 'police',
    label: 'Police (100)',
    number: '100',
    action: 'call',
    actionLabel: 'CALL',
    icon: 'shield',
    tone: 'error',
  },
  {
    id: 'ambulance',
    label: 'Ambulance (102)',
    number: '102',
    action: 'call',
    actionLabel: 'CALL',
    icon: 'medkit',
    tone: 'error',
  },
  {
    id: 'security',
    label: 'BhaiWay Security',
    action: 'alarm',
    actionLabel: 'ALARM',
    icon: 'people',
    tone: 'primary',
  },
] as const;
