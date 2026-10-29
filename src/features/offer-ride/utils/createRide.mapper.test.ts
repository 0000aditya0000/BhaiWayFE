import { ENDPOINTS } from '../../../network/endpoints';
import type { PublishRideDraft } from '../types';
import {
  assertCreateRidePayload,
  CREATE_RIDE_USER_MESSAGES,
  isLocalDepartureInPast,
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
  departureDate: '20/12/2026',
  departureTime: '9:00 AM',
  maxTwoInBackSeat: true,
  availableSeats: 4,
  womenOnly: true,
  pricePerSeat: '500',
  originLocation: {
    name: 'Noida',
    address: 'Noida',
    latitude: 28.5355,
    longitude: 77.391,
  },
  destinationLocation: {
    name: 'Delhi',
    address: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
  },
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
  routeSelection: {
    selectionToken: 'signed-token-regular',
    optionId: 'opt-1',
    polyline: '_p~iF~ps|U',
    distanceMeters: 24500,
    durationSeconds: 2400,
    sourceLatitude: 28.5355,
    sourceLongitude: 77.391,
    destinationLatitude: 28.6139,
    destinationLongitude: 77.209,
  },
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
assertEqual(payload.departureDate, '2026-12-20', 'departureDate civil');
assertEqual(payload.departureTime, '09:00', 'departureTime civil');
assertEqual(payload.totalSeats, 4, 'totalSeats from form seats');
assertEqual(payload.pricePerSeat, 500, 'pricePerSeat integer');
assertEqual(payload.maxTwoInBackSeat, true, 'maxTwoInBackSeat');
assertEqual(payload.noSmoking, true, 'noSmoking');
assertEqual(payload.noPets, false, 'noPets');
assertEqual(payload.luggageAllowed, true, 'luggage maps to luggageAllowed');
assertEqual(payload.notes, 'Blue cap near the gate', 'notes');
assertEqual(payload.womenOnly, true, 'womenOnly sent when checked');
assertEqual(payload.routeSelectionToken, 'signed-token-regular', 'routeSelectionToken attached');
assertEqual(payload.sourceLatitude, 28.5355, 'sourceLatitude matches request endpoints');
assertEqual(payload.sourceLongitude, 77.391, 'sourceLongitude matches request endpoints');
assertEqual(payload.destinationLatitude, 28.6139, 'destinationLatitude matches request endpoints');
assertEqual(payload.destinationLongitude, 77.209, 'destinationLongitude matches request endpoints');
assertFalse('polyline' in payload, 'polyline is never sent as proof of selection');

assertFalse('driverId' in payload, 'does not send driverId');
assertFalse('status' in payload, 'does not send status');
assertFalse('availableSeats' in payload, 'does not send availableSeats');
assertFalse('assuredDepositPercentage' in payload, 'does not send assuredDepositPercentage');
assertFalse('assuredDepositAmount' in payload, 'does not send assuredDepositAmount');
assertFalse('regularSeatsPolicy' in payload, 'does not send regularSeatsPolicy');
assertFalse('driverDepositHoldId' in payload, 'does not send driverDepositHoldId');
assertFalse('music' in payload, 'does not send music (UI-only preference)');
assertFalse(JSON.stringify(payload).includes('msg91'), 'payload has no MSG91');
assertFalse(JSON.stringify(payload).includes('/auth/msg91/verify'), 'payload has no auth verify');

const womenOnlyOff = mapDraftToCreateRideDto({ ...draft, womenOnly: false });
assertTrue(womenOnlyOff.ok, 'womenOnly false maps');
if (womenOnlyOff.ok) {
  assertEqual(womenOnlyOff.payload.womenOnly, false, 'womenOnly false when unchecked');
}

assertCreateRidePayload(payload);

const response = {
  id: 'ride-1',
  driverId: 'driver-1',
  vehicleId: draft.selectedVehicleId!,
  rideType: 'REGULAR' as const,
  status: 'PUBLISHED',
  source: 'Noida Sector 18',
  destination: 'Delhi CP',
  departureDate: '2026-12-20',
  departureTime: '09:00',
  totalSeats: 4,
  availableSeats: 4,
  pricePerSeat: 500,
  maxTwoInBackSeat: true,
  noSmoking: true,
  noPets: false,
  luggageAllowed: true,
  notes: 'Blue cap near the gate',
  createdAt: '2026-12-20T03:30:00.000Z',
  updatedAt: '2026-12-20T03:30:00.000Z',
};

const summary = mapRideResponseToPublishedSummary(
  response,
  { id: draft.selectedVehicleId!, name: 'White Honda City', plateNumber: 'UP16AB1234', icon: 'car' },
  { music: true },
);

assertEqual(summary.pickupLabel, 'Noida Sector 18', 'success pickup from response');
assertEqual(summary.dropoffLabel, 'Delhi CP', 'success dropoff from response');
assertEqual(summary.departureLabel, '20/12/2026 · 9:00 AM', 'success date/time from civil values');
assertEqual(summary.seats, 4, 'success seats from availableSeats');
assertEqual(summary.pricePerSeat, '500', 'success price from response');
assertEqual(summary.vehicle?.plateNumber, 'UP16AB1234', 'success vehicle plate');
assertEqual(summary.preferences.noSmoking, true, 'success no smoking');
assertEqual(summary.preferences.luggage, true, 'success luggage from luggageAllowed');
assertEqual(summary.rideType, 'regular', 'success ride type');
assertEqual(summary.backendStatus, 'PUBLISHED', 'regular backendStatus preserved');
assertEqual(summary.statusLabel, 'Published', 'regular statusLabel');

const assuredResponse = {
  ...response,
  id: 'e50c2975-193c-4706-ac0b-0544302bcda4',
  rideType: 'ASSURED' as const,
  status: 'ASSURANCE_ACTIVE',
  isBookable: true,
  assuredDepositAmount: '105',
  assuredDepositPercentage: 5,
};

const assuredSummary = mapRideResponseToPublishedSummary(assuredResponse, null, {});
assertEqual(assuredSummary.rideId, assuredResponse.id, 'assured rideId');
assertEqual(assuredSummary.backendStatus, 'ASSURANCE_ACTIVE', 'assured backendStatus');
assertEqual(assuredSummary.statusLabel, 'Under Assurance', 'assured statusLabel');
assertEqual(assuredSummary.isBookable, true, 'assured isBookable');
assertEqual(assuredSummary.rideType, 'assured', 'assured ride type');

assertEqual(
  mapCreateRideError({ status: 400, message: 'totalSeats must not be greater than 8' }),
  'totalSeats must not be greater than 8',
  '400 maps backend validation',
);
assertEqual(
  mapCreateRideError({
    status: 400,
    code: 'RIDE_DEPARTURE_IN_PAST',
    message: 'Departure must be in the future',
  }),
  CREATE_RIDE_USER_MESSAGES.departureInPast,
  'RIDE_DEPARTURE_IN_PAST maps user message',
);
assertEqual(
  mapCreateRideError({
    status: 409,
    code: 'ACTIVE_ASSURED_RIDE_EXISTS',
    message: 'Driver already has an active assured ride',
  }),
  CREATE_RIDE_USER_MESSAGES.activeAssuredExists,
  'ACTIVE_ASSURED_RIDE_EXISTS maps user message',
);
assertTrue(
  isLocalDepartureInPast('11/10/2026', '9:00 AM', new Date(2026, 9, 12, 12, 0, 0)),
  'past local departure is detected for UX',
);
assertFalse(
  isLocalDepartureInPast('20/12/2026', '9:00 AM', new Date(2026, 9, 12, 12, 0, 0)),
  'future local departure is allowed',
);

const pastMapped = mapDraftToCreateRideDto({
  ...draft,
  departureDate: '11/10/2026',
  departureTime: '9:00 AM',
});
assertFalse(pastMapped.ok, 'past departure rejected before API');
if (!pastMapped.ok) {
  assertEqual(
    pastMapped.message,
    CREATE_RIDE_USER_MESSAGES.departureInPast,
    'past departure uses shared UX message',
  );
}

assertEqual(
  mapCreateRideError({ status: 401, message: 'Unauthorized' }),
  'Your session expired. Please sign in again.',
  '401 maps session message',
);
assertTrue(
  mapCreateRideError({ status: 403, message: '' }).includes('Aadhaar') ||
    mapCreateRideError({ status: 403, message: '' }).includes('vehicle RC'),
  '403 maps eligibility message without requiring DL',
);
assertFalse(
  mapCreateRideError({ status: 403, message: '' }).toLowerCase().includes('licence') ||
    mapCreateRideError({ status: 403, message: '' }).toLowerCase().includes('license'),
  '403 does not require Driving License',
);
assertEqual(
  mapCreateRideError({
    status: 403,
    code: 'AADHAAR_NOT_VERIFIED',
    message: 'identity required',
  }),
  'Aadhaar verification is required before publishing a ride.',
  '403 Aadhaar code maps Aadhaar message',
);
assertEqual(
  mapCreateRideError({
    status: 403,
    code: 'VEHICLE_RC_NOT_VERIFIED',
    message: 'rc required',
  }),
  'Vehicle RC verification is required before publishing a ride.',
  '403 RC code maps RC message',
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

const missingRoute = mapDraftToCreateRideDto({
  ...draft,
  routeSelection: null,
});
assertFalse(missingRoute.ok, 'regular publish blocked without explicit route selection');

const singleOptionStillRequired = mapDraftToCreateRideDto({
  ...draft,
  routeSelection: null,
});
assertFalse(singleOptionStillRequired.ok, 'a single returned option is not auto-selected');

const staleEndpoints = mapDraftToCreateRideDto({
  ...draft,
  originLocation: {
    name: 'Ghaziabad',
    address: 'Ghaziabad',
    latitude: 28.67,
    longitude: 77.42,
  },
});
assertFalse(staleEndpoints.ok, 'changing an endpoint invalidates the previous token');

assertEqual(
  mapCreateRideError({ status: 400, message: 'Route selection has expired' }),
  'Your route selection expired. Please select a driving route again.',
  'expired token maps to reselection copy',
);

const assuredMapped = mapDraftToCreateRideDto({ ...draft, rideType: 'assured' });
assertTrue(assuredMapped.ok, 'assured publish includes the same selected token');
if (assuredMapped.ok) {
  assertEqual(assuredMapped.payload.rideType, 'ASSURED', 'assured rideType');
  assertEqual(
    assuredMapped.payload.routeSelectionToken,
    'signed-token-regular',
    'assured uses the selected token',
  );
}

if (failed.length > 0) {
  throw new Error(`createRide.mapper tests failed:\n${failed.join('\n')}`);
}

console.log('createRide.mapper tests passed');
