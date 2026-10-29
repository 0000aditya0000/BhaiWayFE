import { ROUTES } from '@/config';
import type { SelectedDrivingRoute } from '@/features/offer-ride/api/routeOptions.types';
import {
  DEFAULT_RIDE_PREFERENCES,
  PUBLISH_RIDE_VEHICLES,
  RIDE_PREFERENCE_OPTIONS,
} from '@/features/offer-ride/constants';
import type { PublishRidePreferences, RidePreferenceId } from '@/features/offer-ride/types';

export const MODIFY_RIDE_SCREEN = {
  brandName: 'BhaiWay',
  title: 'Modify Outstation Ride',
  routeTitle: 'Route Details',
  schedulingTitle: 'Scheduling',
  seatingTitle: 'Seating & Pricing',
  preferencesTitle: 'Ride Preferences',
  vehicleTitle: 'Vehicle Details',
  addVehicleLabel: '+ Add New',
  departureTimeLabel: 'Departure Time',
  travelDateLabel: 'Travel Date',
  availableSeatsLabel: 'Total seats',
  pricePerSeatLabel: 'Price per seat',
  maxTwoLabel: 'Max 2 people in back seat',
  maxTwoHint: 'Ensures comfort and premium experience',
  womenOnlyLabel: 'Women Only Ride',
  womenOnlyHint: 'Only verified female riders can book this ride',
  womenOnlyLockedHint: 'Women Only cannot be changed after the first booking',
  updateLabel: 'Update Ride Details',
  updateSuccessTitle: 'Ride updated',
  updateSuccessMessage: 'Your outstation ride details have been updated.',
  updateErrorTitle: 'Unable to update ride',
  missingRideMessage: 'Missing ride id. Open Modify Ride from My Rides.',
  notEditableMessage:
    'This ride can only be modified while it is still published and has not started.',
  bookingLockMessage:
    'Some seats are already booked. Trip details and fare cannot be changed. You can only adjust the remaining seat capacity.',
  bookedSeatsLabel: (count: number) => `Booked: ${count}`,
  totalSeatsLabel: (count: number) => `Total seats: ${count}`,
  minimumSeatsLabel: (count: number) => `Minimum seats: ${count}`,
  lockedHint: 'Locked — bookings exist',
  loadingMessage: 'Loading ride details…',
  retryLabel: 'Retry',
  addVehicleMessage: 'Adding a new vehicle will be available soon.',
  selectRouteLabel: 'Select driving route',
  selectRouteHint: 'Changing pickup or drop-off requires a new driving route.',
  missingRouteHint: 'This ride has no driver-selected route on file. Changing pickup or drop-off requires selecting a route.',
  routeSelectedLabel: 'Driving route on file',
  routeNeedsSelection: 'Select a driving route before saving route changes.',
} as const;

export interface ModifyRideFormState {
  rideId: string;
  origin: string;
  destination: string;
  originalOrigin: string;
  originalDestination: string;
  departureDate: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: string;
  maxTwoInBackSeat: boolean;
  womenOnly: boolean;
  preferences: PublishRidePreferences;
  selectedVehicleId: string;
  originLatitude: number | null;
  originLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  routeSelection: SelectedDrivingRoute | null;
  routeSelected: boolean;
  routeLengthMeters: number | null;
  routeDurationSeconds: number | null;
}

export const DEFAULT_MODIFY_RIDE_FORM: ModifyRideFormState = {
  rideId: '',
  origin: '',
  destination: '',
  originalOrigin: '',
  originalDestination: '',
  departureDate: '',
  departureTime: '',
  availableSeats: 1,
  pricePerSeat: '',
  maxTwoInBackSeat: false,
  womenOnly: false,
  preferences: {
    ...DEFAULT_RIDE_PREFERENCES,
  },
  selectedVehicleId: '',
  originLatitude: null,
  originLongitude: null,
  destinationLatitude: null,
  destinationLongitude: null,
  routeSelection: null,
  routeSelected: false,
  routeLengthMeters: null,
  routeDurationSeconds: null,
};

export const MODIFY_RIDE_PREFERENCE_OPTIONS = RIDE_PREFERENCE_OPTIONS;
/** @deprecated Prefer My Garage vehicles via GET /vehicles. */
export const MODIFY_RIDE_VEHICLES = PUBLISH_RIDE_VEHICLES;

export type ModifyRidePreferenceId = RidePreferenceId;

export const getModifyRidePath = (params: {
  rideId: string;
  pickupLabel?: string;
  dropoffLabel?: string;
  dateLabel?: string;
}) => ({
  pathname: ROUTES.myRidesModifyRide,
  params: {
    rideId: params.rideId,
    ...(params.pickupLabel ? { pickupLabel: params.pickupLabel } : {}),
    ...(params.dropoffLabel ? { dropoffLabel: params.dropoffLabel } : {}),
    ...(params.dateLabel ? { dateLabel: params.dateLabel } : {}),
  },
});
