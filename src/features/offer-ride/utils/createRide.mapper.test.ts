import { ENDPOINTS } from '../../../network/endpoints';
import type { PublishRideDraft } from '../types';
import {
  assertCreateRidePayload,
  mapCreateRideError,
  mapDraftToCreateRideDto,
  mapRideResponseToPublishedSummary,
  parsePricePerSeat,
  toApiDepartureDate,
  toApiDepartureTime,
} from './createRide.mapper';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const assertFalse = (value: boolean, label: string): void => {
  if (value) {
    failed.push(`${label}: expected false`);
  }
};

assertEqual(ENDPOINTS.rides.create, '/rides', 'POST /rides endpoint');
assertEqual(ENDPOINTS.rides.my, '/rides/my', 'GET /rides/my endpoint');
assertFalse(ENDPOINTS.rides.create.includes('msg91'), 'create ride is not MSG91');

assertEqual(toApiDepartureDate('20/08/2026'), '2026-08-20', 'civil date maps to YYYY-MM-DD');
assertEqual(toApiDepartureTime('9:00 AM'), '09:00', '12h time maps to HH:mm');
assertEqual(toApiDepartureTime('09:05'), '09:05', '24h time is preserved');
assertEqual(parsePricePerSeat('250.00'), 250, 'price is integer points');

const draft: PublishRideDraft = {
  rideType: 'regular',
  origin: 'Noida',
  destination: 'Delhi',
  departureDate: '20/08/2026',
  departureTime: '9:00 AM',
  maxTwoInBackSeat: true,
  availableSeats: 4,
  womenOnly: true,
  pricePerSeat: '500',
  originLocation: null,
  destinationLocation: null,
  preferences: {
    noSmoking: true,
    noPets: false,
    luggage: true,
    music: true,
  },
  notes: 'Blue cap near the gate',
  selectedVehicleId: '11111111-2222-3333-4444-555555555555',
  promoCode: '',
  promoApplied: false,
};

const mapped = mapDraftToCreateRideDto(draft);
assertTrue(mapped.ok, 'valid regular ride maps');
if (!mapped.ok) {
  throw new Error(`expected valid payload, got ${mapped.message}`);
}

const payload = mapped.payload;
assertEqual(payload.rideType, 'REGULAR', 'rideType is always REGULAR');
assertEqual(payload.vehicleId, draft.selectedVehicleId, 'vehicleId is UUID only');
assertEqual(payload.source, 'Noida', 'source');
assertEqual(payload.destination, 'Delhi', 'destination');
assertEqual(payload.departureDate, '2026-08-20', 'departureDate civil');
assertEqual(payload.departureTime, '09:00', 'departureTime civil');
assertEqual(payload.totalSeats, 4, 'totalSeats from form seats');
assertEqual(payload.pricePerSeat, 500, 'pricePerSeat integer');
assertEqual(payload.maxTwoInBackSeat, true, 'maxTwoInBackSeat');
assertEqual(payload.noSmoking, true, 'noSmoking');
assertEqual(payload.noPets, false, 'noPets');
assertEqual(payload.luggageAllowed, true, 'luggage maps to luggageAllowed');
assertEqual(payload.notes, 'Blue cap near the gate', 'notes');

assertFalse('driverId' in payload, 'does not send driverId');
assertFalse('status' in payload, 'does not send status');
assertFalse('availableSeats' in payload, 'does not send availableSeats');
assertFalse('assuredDepositPercentage' in payload, 'does not send assuredDepositPercentage');
assertFalse('assuredDepositAmount' in payload, 'does not send assuredDepositAmount');
assertFalse('regularSeatsPolicy' in payload, 'does not send regularSeatsPolicy');
assertFalse('driverDepositHoldId' in payload, 'does not send driverDepositHoldId');
assertFalse('womenOnly' in payload, 'does not send women-only (future backend field)');
assertFalse('music' in payload, 'does not send music (UI-only preference)');
assertFalse(JSON.stringify(payload).includes('msg91'), 'payload has no MSG91');
assertFalse(JSON.stringify(payload).includes('/auth/msg91/verify'), 'payload has no auth verify');

assertCreateRidePayload(payload);

const response = {
  id: 'ride-1',
  driverId: 'driver-1',
  vehicleId: draft.selectedVehicleId!,
  rideType: 'REGULAR' as const,
  status: 'PUBLISHED',
  source: 'Noida Sector 18',
  destination: 'Delhi CP',
  departureDate: '2026-08-20',
  departureTime: '09:00',
  totalSeats: 4,
  availableSeats: 4,
  pricePerSeat: 500,
  maxTwoInBackSeat: true,
  noSmoking: true,
  noPets: false,
  luggageAllowed: true,
  notes: 'Blue cap near the gate',
  createdAt: '2026-08-20T03:30:00.000Z',
  updatedAt: '2026-08-20T03:30:00.000Z',
};

const summary = mapRideResponseToPublishedSummary(
  response,
  { id: draft.selectedVehicleId!, name: 'White Honda City', plateNumber: 'UP16AB1234', icon: 'car' },
  { music: true },
);

assertEqual(summary.pickupLabel, 'Noida Sector 18', 'success pickup from response');
assertEqual(summary.dropoffLabel, 'Delhi CP', 'success dropoff from response');
assertEqual(summary.departureLabel, '20/08/2026 · 9:00 AM', 'success date/time from civil values');
assertEqual(summary.seats, 4, 'success seats from availableSeats');
assertEqual(summary.pricePerSeat, '500', 'success price from response');
assertEqual(summary.vehicle?.plateNumber, 'UP16AB1234', 'success vehicle plate');
assertEqual(summary.preferences.noSmoking, true, 'success no smoking');
assertEqual(summary.preferences.luggage, true, 'success luggage from luggageAllowed');
assertEqual(summary.rideType, 'regular', 'success ride type');

assertEqual(
  mapCreateRideError({ status: 400, message: 'totalSeats must not be greater than 8' }),
  'totalSeats must not be greater than 8',
  '400 maps backend validation',
);
assertEqual(
  mapCreateRideError({ status: 401, message: 'Unauthorized' }),
  'Your session expired. Please sign in again.',
  '401 maps session message',
);
assertTrue(
  mapCreateRideError({ status: 403, message: '' }).includes('not currently eligible'),
  '403 maps eligibility message',
);
assertTrue(
  mapCreateRideError({ status: 0, message: '' }).toLowerCase().includes('connection'),
  'network error mapping',
);

const missingVehicle = mapDraftToCreateRideDto({
  ...draft,
  selectedVehicleId: null,
});
assertFalse(missingVehicle.ok, 'vehicle is required');

if (failed.length > 0) {
  throw new Error(`createRide.mapper tests failed:\n${failed.join('\n')}`);
}

console.log('createRide.mapper tests passed');
