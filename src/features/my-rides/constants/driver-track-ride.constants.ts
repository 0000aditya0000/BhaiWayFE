import { ROUTES } from '@/config';

import type {
  DriverTrackConfirmedPassenger,
  DriverTrackPendingRequest,
  DriverTrackRideSummary,
} from '../types/driver-track-ride.types';

export const DRIVER_TRACK_RIDE_SCREEN = {
  title: 'Ride Details',
  activeLabel: 'Published ride',
  routeOverviewLabel: 'Route',
  tripStatsLabel: 'Trip snapshot',
  passengersLabel: 'Passengers',
  passengersSummary: (booked: number, remaining: number) =>
    booked === 1
      ? `1 booked · ${remaining} seats remaining`
      : `${booked} booked · ${remaining} seats remaining`,
  confirmedTitle: (confirmed: number, total: number) => `Confirmed (${confirmed}/${total})`,
  pendingTitle: (count: number) => `Pending Requests (${count})`,
  fullPercentLabel: (percent: number) => `${percent}% Full`,
  emptyPassengersTitle: 'No passengers have booked this ride yet.',
  emptyPassengersSubtitle: 'Confirmed bookings will appear here after a passenger books.',
  loadingLabel: 'Loading passengers…',
  errorTitle: 'Unable to load bookings',
  errorRetryLabel: 'Try again',
  sourceLabel: 'Pickup',
  destinationLabel: 'Drop-off',
  dateLabel: 'Date',
  departureLabel: 'Departure',
  vehicleLabel: 'Vehicle',
  totalSeatsLabel: 'Total seats',
  bookedSeatsLabel: 'Booked',
  availableSeatsLabel: 'Open',
  seatsFillLabel: 'Seat fill',
  statusLabel: 'Status',
  paymentLabel: 'Payment',
  paymentMethodLabel: 'Payment method',
  bookedAtLabel: 'Booked',
  fareLabel: 'Fare',
  callUnavailableLabel: 'Call unavailable',
  chatUnavailableLabel: 'Chat unavailable',
  declineLabel: 'Decline',
  acceptLabel: 'Accept',
  ridesLabel: (count: number) => `${count} RIDES`,
  seatsAppliedLabel: (count: number) =>
    count === 1 ? 'Applied for 1 seat' : `Applied for ${count} seats`,
  seatsBookedShort: (count: number) => (count === 1 ? '1 seat' : `${count} seats`),
  idVerifiedLabel: 'ID VERIFIED',
  callAlertTitle: 'Call',
  chatAlertTitle: 'Chat',
  callAlertMessage: (name: string) => `Calling ${name} will be available soon.`,
  chatAlertMessage: (name: string) => `Chat with ${name} will be available soon.`,
  contactUnavailableMessage: 'Phone number is not available on this booking yet.',
  contactUnavailablePassengerMessage:
    'Passenger phone number is not on this booking yet. Backend needs to send passenger.phone (or phoneNumber / mobile) on GET /bookings/driver/my-rides.',
  contactUnavailableDriverMessage:
    'Driver phone number is not on this booking yet. Backend needs to send driver.phone (or phoneNumber / mobile) on GET /bookings/:id and GET /bookings/my.',
  callFailedMessage: 'Unable to start a call right now.',
  cancelRideLabel: 'Cancel Ride',
  rideTypeLabel: 'Ride type',
  assuredLabel: 'ASSURED',
  regularLabel: 'REGULAR',
  commuteLabel: 'COMMUTE',
  depositLabel: 'Security deposit',
  pendingEmptyTitle: 'No pending booking requests',
  pendingEmptySubtitle: 'New Daily Office Commute requests will appear here.',
  acceptedMessage: (name: string) => `${name} has been accepted.`,
  declinedMessage: (name: string) => `${name}'s request was declined.`,
} as const;

const AVATAR_ROHAN =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDcBd96RX-cSWPbpdQQv04InPo08bZTl6w1iowdZNQKsWDKE-evS0t8cAc1JXZ7u589scy17jic6iNU9wk1oDJZTQ_swPp33AVaBOAZL17bN_nnGAvY91Bny1bpAZXR2vbd8xijkIl1e5-T6oPuhjAHYGYHFF9FJSaiYdxJOCVfA1eft-RztwNpgD2zgR3M5g2GXyJJsRfiEZdYCjcfbDKktvkmYJfLozhEWBYh0vnDLwRPaXjre8VnmZuMOGO7nQYInteepgv94ug';
const AVATAR_PRIYA =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAcfH1AW7_5KiRSs2kB9NI0lM4imphLulD-3KnJ-rqK3xhRB-nSTZ1LU9FeupCcBvhbt-yTRDPuT4n9BGjz85egTp8JTK_9EE5VFOkkzfDm4C-etdKwn9fhyi_OpSCmSSP4vrEeH6ooJmvbi8BM3GNmevpNwfEu1po396LIyZBmScW0Tvfne2pOekEvnec51iwNgSWRQke-eptgu1uCQZeSQtnA_vG2oRqIRFHILgd4quNhUWbbx5krfXPdUlW2Ng3uKEPJZASAgoE';

export const DEFAULT_CONFIRMED_PASSENGERS: readonly DriverTrackConfirmedPassenger[] = [];

export const DEFAULT_PENDING_REQUESTS: readonly DriverTrackPendingRequest[] = [
  {
    id: 'pending-rohan',
    name: 'Rohan M.',
    subtitle: 'Senior Engineer @ Google',
    rating: 4.7,
    ridesCount: 142,
    idVerified: true,
    avatarUri: AVATAR_ROHAN,
    seatsBooked: 2,
    bookingId: 'pending-rohan',
  },
  {
    id: 'pending-priya',
    name: 'Priya S.',
    subtitle: 'Verified @ Microsoft',
    rating: 4.9,
    ridesCount: 89,
    idVerified: true,
    avatarUri: AVATAR_PRIYA,
    seatsBooked: 1,
    bookingId: 'pending-priya',
  },
];

export const DEFAULT_DRIVER_TRACK_RIDE: DriverTrackRideSummary = {
  rideId: 'driving-upcoming-regular-1',
  listingId: 'BW-9942',
  rideType: 'regular',
  routeTitle: 'Saket → Cyber City',
  source: 'Saket',
  destination: 'Cyber City',
  dateLabel: 'Oct 25, 09:00 AM',
  departureTimeLabel: '09:00 AM',
  vehicleLabel: '',
  seatsConfirmed: 0,
  seatsAvailable: 4,
  seatsTotal: 4,
  bookingCount: 0,
  pickup: null,
  dropoff: null,
  confirmed: DEFAULT_CONFIRMED_PASSENGERS,
  pending: DEFAULT_PENDING_REQUESTS,
};

export const getDriverTrackRidePath = (
  rideId: string,
  extra?: { claimId?: string },
) => ({
  pathname: ROUTES.myRidesTrack,
  params: {
    rideId,
    claimId: extra?.claimId?.trim() || '',
  },
});
