import type {
  HistoryRideItem,
  UpcomingRideRider,
  UpcomingRideSummary,
} from '../types/my-rides.types';

export const MY_RIDES_SCREEN = {
  title: 'My Rides',
  riderModeBadge: 'Rider Mode',
  driverModeBadge: 'Driver Mode',
  tabUpcoming: 'UPCOMING',
  tabPast: 'PAST',
  assuredLabel: 'ASSURED',
  regularLabel: 'REGULAR',
  commuteLabel: 'COMMUTE',
  otpLabel: 'OTP',
  pickupLabel: 'Pickup',
  dropoffLabel: 'Drop-off',
  verifiedLabel: 'VERIFIED',
  cancelLabelRiding: 'Cancel Request',
  cancelLabelDriving: 'Cancel Ride',
  modifyLabel: 'Modify',
  trackLabelRiding: 'Track Ride',
  trackLabelDriving: 'Start Ride',
  /** Shown when ride.status is already IN_PROGRESS. */
  trackLabelDrivingInProgress: 'Continue Ride',
  peerLabelRiding: 'Your driver',
  peerLabelDriving: 'Your Riders',
  seatsBookedLabel: (count: number) => (count === 1 ? '+1 seat' : `+${count} seats`),
  passengersBookedSummary: (booked: number, remaining: number) =>
    `${booked} booked · ${remaining} seats remaining`,
  emptyRidersDriving: 'No confirmed riders yet',
  emptyRidersRegularHint: 'No passengers have booked this ride yet.',
  emptyUpcomingTitle: 'No upcoming rides',
  emptyUpcomingSubtitleRiding: 'Book a carpool or office commute and it will show up here.',
  emptyUpcomingSubtitleDriving: 'Publish a carpool ride and booked trips will show up here.',
  emptyPastTitle: 'No past rides yet',
  emptyPastSubtitleRiding: 'Completed rides will show up in this tab.',
  emptyPastSubtitleDriving: 'Completed published rides will show up in this tab.',
  emptyUpcomingSubtitleOffice:
    'Book or publish an office commute and it will show up here.',
  pendingRequestsBannerCta: 'Review',
  emptyPastSubtitleOffice: 'Completed office commute rides will show up in this tab.',
  historyLoadingError: 'Unable to load past rides. Pull to refresh.',
  historyLoadingLabel: 'Loading past rides…',
  loadMoreLabel: 'Load more',
  loadMoreError: 'Could not load more. Tap to retry.',
  rideDetailsLabel: 'Ride Details',
  cancelTitleRiding: 'Cancel Request',
  cancelTitleDriving: 'Cancel Ride',
  cancelMessage: 'Cancellation will be available soon.',
} as const;

const DRIVER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBWhK2iX3bo9PpAU5iqQWZ7gh0Wx_RZ4RIYmw6C0lo8VMj9ER9tbJQFoQNfD7GbGmTgI097WJVut_660L0PvUuL1oRbSjRHV8ncHGCHZqiLKLWGgsyP1QQ_lSN9AhkWoIrZBC4BVNwDeS4NOzSWwFJ_nA5R0zuH0gGFaeg5FK6g9mX67ukyazdmZ483pfut7hO15sADSGLfoiji3at_Z579WksNQOH7Ym2C82Vxj-cKVXDLaH2zcIFYIonlGsfcXyOnsuT8JtVV8LI';

const RIDER_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCR7ViiU6Qfa72nqWMzfLs40ePuMA0iRVfsyayCPGmrTPMUzK7NWTISui3Lpj3DNzSYQsOwKdC257B5AEmyiSFE5jFyWAht7w3xmH_EFfYq2XEwAuK9F--fVXFpKJSv9JDXHI0r5CKBoQ-KrIlBFgb0nVEm6XfBqvlzgDbLxz-beRb0BV9Iy8X442-3IS_z7cbvFOrlY106-u9M-6tqQFxp5iVeyaMcFK_Dv6--e_P6OiFt0Evx3MiHUfG8VeQXbwhhyLCwjsyhqgw';

const AVATAR_PRIYA =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAcfH1AW7_5KiRSs2kB9NI0lM4imphLulD-3KnJ-rqK3xhRB-nSTZ1LU9FeupCcBvhbt-yTRDPuT4n9BGjz85egTp8JTK_9EE5VFOkkzfDm4C-etdKwn9fhyi_OpSCmSSP4vrEeH6ooJmvbi8BM3GNmevpNwfEu1po396LIyZBmScW0Tvfne2pOekEvnec51iwNgSWRQke-eptgu1uCQZeSQtnA_vG2oRqIRFHILgd4quNhUWbbx5krfXPdUlW2Ng3uKEPJZASAgoE';
const AVATAR_ROHAN =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDcBd96RX-cSWPbpdQQv04InPo08bZTl6w1iowdZNQKsWDKE-evS0t8cAc1JXZ7u589scy17jic6iNU9wk1oDJZTQ_swPp33AVaBOAZL17bN_nnGAvY91Bny1bpAZXR2vbd8xijkIl1e5-T6oPuhjAHYGYHFF9FJSaiYdxJOCVfA1eft-RztwNpgD2zgR3M5g2GXyJJsRfiEZdYCjcfbDKktvkmYJfLozhEWBYh0vnDLwRPaXjre8VnmZuMOGO7nQYInteepgv94ug';

const ASSURED_RIDERS: readonly UpcomingRideRider[] = [
  {
    id: 'assured-rider-priya',
    name: 'Priya Sharma',
    subtitle: 'Verified at Infosys',
    seatsBooked: 2,
    verified: true,
    avatarUri: AVATAR_PRIYA,
  },
  {
    id: 'assured-rider-rohan',
    name: 'Rohan M.',
    subtitle: 'Verified at Google',
    seatsBooked: 1,
    verified: true,
    avatarUri: AVATAR_ROHAN,
  },
];

/** Rider mode: Delhi Sector 12 → Gurugram office corridor */
const RIDER_PICKUP = { latitude: 28.5921, longitude: 77.046 } as const;
const RIDER_DROPOFF = { latitude: 28.4595, longitude: 77.0266 } as const;

/** Driver mode: Koramangala → Electronic City */
const DRIVER_PICKUP = { latitude: 12.9352, longitude: 77.6245 } as const;
const DRIVER_DROPOFF = { latitude: 12.8399, longitude: 77.677 } as const;

export const DEFAULT_UPCOMING_RIDE: UpcomingRideSummary = {
  id: 'upcoming-1',
  dateLabel: 'TODAY, 08:30 AM',
  title: 'Ride Confirmed',
  assured: true,
  otp: '4921',
  pickupLabel: 'Delhi Center, Sector 12',
  dropoffLabel: 'Altus Mindstream Office',
  pickup: { ...RIDER_PICKUP },
  dropoff: { ...RIDER_DROPOFF },
  peer: {
    name: 'Arjun S.',
    vehicleLabel: 'Swift Dzire',
    plateNumber: 'DL 01 AB 1234',
    verified: true,
    avatarUri: DRIVER_AVATAR,
  },
  driver: {
    name: 'Arjun S.',
    vehicleLabel: 'Swift Dzire',
    plateNumber: 'DL 01 AB 1234',
    verified: true,
    avatarUri: DRIVER_AVATAR,
  },
};

export const DEFAULT_DRIVING_UPCOMING_RIDE: UpcomingRideSummary = {
  id: 'driving-upcoming-1',
  dateLabel: 'TODAY, 07:00 AM',
  title: 'Ride Published',
  assured: true,
  otp: '3184',
  pickupLabel: 'Koramangala 5th Block',
  dropoffLabel: 'Electronic City Phase 1',
  pickup: { ...DRIVER_PICKUP },
  dropoff: { ...DRIVER_DROPOFF },
  peer: {
    name: 'Priya Sharma',
    vehicleLabel: '2 seats booked',
    plateNumber: '240 earned',
    verified: true,
    avatarUri: AVATAR_PRIYA,
  },
  driver: {
    name: 'Priya Sharma',
    vehicleLabel: '2 seats booked',
    plateNumber: '240 earned',
    verified: true,
    avatarUri: AVATAR_PRIYA,
  },
  riders: ASSURED_RIDERS,
};

/** Driver mode: second upcoming card — regular (non-assured) ride.
 * Confirmed riders start empty; driver accepts from Track My Ride. */
const DRIVER_REGULAR_PICKUP = { latitude: 28.5244, longitude: 77.2066 } as const;
const DRIVER_REGULAR_DROPOFF = { latitude: 28.4595, longitude: 77.0266 } as const;

export const DEFAULT_DRIVING_UPCOMING_REGULAR_RIDE: UpcomingRideSummary = {
  id: 'driving-upcoming-regular-1',
  dateLabel: 'OCT 25, 09:00 AM',
  title: 'Ride Published',
  assured: false,
  otp: '7529',
  pickupLabel: 'Saket',
  dropoffLabel: 'Cyber City',
  pickup: { ...DRIVER_REGULAR_PICKUP },
  dropoff: { ...DRIVER_REGULAR_DROPOFF },
  peer: {
    name: 'Pending requests',
    vehicleLabel: '0 seats confirmed',
    plateNumber: 'Accept riders to confirm',
    verified: false,
    avatarUri: AVATAR_PRIYA,
  },
  driver: {
    name: 'Pending requests',
    vehicleLabel: '0 seats confirmed',
    plateNumber: 'Accept riders to confirm',
    verified: false,
    avatarUri: AVATAR_PRIYA,
  },
  riders: [],
};

export const DEFAULT_DRIVING_UPCOMING_RIDES: readonly UpcomingRideSummary[] = [
  DEFAULT_DRIVING_UPCOMING_RIDE,
  DEFAULT_DRIVING_UPCOMING_REGULAR_RIDE,
];

/** Office commute My Rides: rider booking card (shows OTP). */
export const DEFAULT_OFFICE_COMMUTE_RIDER_RIDE: UpcomingRideSummary = {
  ...DEFAULT_UPCOMING_RIDE,
  id: 'office-rider-upcoming-1',
  title: 'Office Seat Booked',
  role: 'rider',
};

/** Office commute My Rides: published driver card (no OTP). */
export const DEFAULT_OFFICE_COMMUTE_DRIVER_RIDE: UpcomingRideSummary = {
  id: 'office-driver-upcoming-1',
  dateLabel: 'TODAY, 09:00 AM',
  title: 'Office Ride Published',
  assured: true,
  otp: '',
  pickupLabel: 'Delhi Center, Sector 12',
  dropoffLabel: 'Altus Mindstream Office',
  pickup: { ...RIDER_PICKUP },
  dropoff: { ...RIDER_DROPOFF },
  role: 'driver',
  peer: {
    name: 'Priya Sharma',
    vehicleLabel: '2 seats booked',
    plateNumber: '180 earned',
    verified: true,
    avatarUri: AVATAR_PRIYA,
  },
  driver: {
    name: 'Priya Sharma',
    vehicleLabel: '2 seats booked',
    plateNumber: '180 earned',
    verified: true,
    avatarUri: AVATAR_PRIYA,
  },
  riders: ASSURED_RIDERS,
};

export const DEFAULT_OFFICE_COMMUTE_UPCOMING_RIDES: readonly UpcomingRideSummary[] = [
  DEFAULT_OFFICE_COMMUTE_RIDER_RIDE,
  DEFAULT_OFFICE_COMMUTE_DRIVER_RIDE,
];

export const DEFAULT_HISTORY_RIDES: readonly HistoryRideItem[] = [
  {
    id: 'history-1',
    title: 'Delhi → Meerut',
    routeLabel: 'Delhi → Meerut',
    dateLabel: '24 Jul 2026 • 08:30 AM',
    statusLabel: 'Completed',
    pickupLabel: 'Delhi',
    dropoffLabel: 'Meerut',
    pickup: { latitude: 28.6139, longitude: 77.209 },
    dropoff: { latitude: 28.9845, longitude: 77.7064 },
    role: 'rider',
  },
  {
    id: 'history-2',
    title: 'Gurugram → Delhi',
    routeLabel: 'Gurugram → Delhi',
    dateLabel: '20 Jul 2026 • 06:15 PM',
    statusLabel: 'Completed',
    pickupLabel: 'Gurugram',
    dropoffLabel: 'Delhi',
    pickup: { ...RIDER_DROPOFF },
    dropoff: { ...RIDER_PICKUP },
    role: 'rider',
  },
  {
    id: 'history-3',
    title: 'Noida → Delhi',
    routeLabel: 'Noida → Delhi',
    dateLabel: '15 Jul 2026 • 09:00 AM',
    statusLabel: 'Completed',
    pickupLabel: 'Noida',
    dropoffLabel: 'Delhi',
    pickup: { latitude: 28.5355, longitude: 77.391 },
    dropoff: { latitude: 28.6139, longitude: 77.209 },
    role: 'rider',
  },
  {
    id: 'history-4',
    title: 'Delhi → Ghaziabad',
    routeLabel: 'Delhi → Ghaziabad',
    dateLabel: '10 Jul 2026 • 07:45 AM',
    statusLabel: 'Completed',
    pickupLabel: 'Delhi',
    dropoffLabel: 'Ghaziabad',
    pickup: { latitude: 28.6139, longitude: 77.209 },
    dropoff: { latitude: 28.6692, longitude: 77.4538 },
    role: 'rider',
  },
] as const;

/** Office commute past list: rider + driver journeys together. */
export const DEFAULT_OFFICE_COMMUTE_HISTORY_RIDES: readonly HistoryRideItem[] = [
  ...DEFAULT_HISTORY_RIDES,
  {
    id: 'office-history-driver-1',
    title: 'Delhi → Noida',
    routeLabel: 'Delhi → Noida',
    dateLabel: '22 Jul 2026 • 09:00 AM',
    statusLabel: 'Completed',
    pickupLabel: 'Delhi',
    dropoffLabel: 'Noida',
    pickup: { latitude: 28.6139, longitude: 77.209 },
    dropoff: { latitude: 28.5355, longitude: 77.391 },
    role: 'driver',
  },
] as const;

export const DEFAULT_DRIVING_HISTORY_RIDES: readonly HistoryRideItem[] = [
  {
    id: 'driving-history-1',
    title: 'Delhi → Meerut',
    routeLabel: 'Delhi → Meerut',
    dateLabel: '24 Jul 2026 • 07:30 AM',
    statusLabel: 'Completed',
    pickupLabel: 'Delhi',
    dropoffLabel: 'Meerut',
    pickup: { latitude: 28.6139, longitude: 77.209 },
    dropoff: { latitude: 28.9845, longitude: 77.7064 },
    role: 'driver',
  },
  {
    id: 'driving-history-2',
    title: 'Ghaziabad → Gurgaon',
    routeLabel: 'Ghaziabad → Gurgaon',
    dateLabel: '20 Jul 2026 • 08:00 AM',
    statusLabel: 'Completed',
    pickupLabel: 'Ghaziabad',
    dropoffLabel: 'Gurgaon',
    pickup: { latitude: 28.6692, longitude: 77.4538 },
    dropoff: { latitude: 28.4595, longitude: 77.0266 },
    role: 'driver',
  },
  {
    id: 'driving-history-3',
    title: 'Noida → Delhi',
    routeLabel: 'Noida → Delhi',
    dateLabel: '15 Jul 2026 • 06:45 AM',
    statusLabel: 'Completed',
    pickupLabel: 'Noida',
    dropoffLabel: 'Delhi',
    pickup: { latitude: 28.5355, longitude: 77.391 },
    dropoff: { latitude: 28.6139, longitude: 77.209 },
    role: 'driver',
  },
  {
    id: 'driving-history-4',
    title: 'Faridabad → Delhi',
    routeLabel: 'Faridabad → Delhi',
    dateLabel: '10 Jul 2026 • 09:15 AM',
    statusLabel: 'Completed',
    pickupLabel: 'Faridabad',
    dropoffLabel: 'Delhi',
    pickup: { latitude: 28.4089, longitude: 77.3178 },
    dropoff: { latitude: 28.6139, longitude: 77.209 },
    role: 'driver',
  },
] as const;

export const DEFAULT_PROFILE_AVATAR = RIDER_AVATAR;
