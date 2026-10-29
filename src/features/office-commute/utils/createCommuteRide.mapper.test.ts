import type { PublishCommuteDraft } from '../types';
import { mapPublishCommuteDraftToCreateRide } from './createCommuteRide.mapper';
import { ROUTE_SELECTION_USER_MESSAGES } from '@/features/offer-ride/utils/routeSelection';
import { COMMUTE_SERIES_COPY } from '../constants/commute-series.constants';
import {
  commutePublishIdempotencyStore,
  commutePublishRequiresIdempotency,
  excludeWeekdaysFromIncluded,
} from './commuteSeries.utils';

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

const outboundSelection = {
  selectionToken: 'commute-token',
  optionId: 'opt-c1',
  polyline: '_p~iF~ps|U',
  distanceMeters: 12000,
  durationSeconds: 1800,
  sourceLatitude: 28.5494,
  sourceLongitude: 77.2001,
  destinationLatitude: 28.6315,
  destinationLongitude: 77.2167,
};

const returnSelection = {
  selectionToken: 'commute-return-token',
  optionId: 'opt-r1',
  polyline: '_p~iF~ps|U',
  distanceMeters: 12500,
  durationSeconds: 1900,
  sourceLatitude: 28.6315,
  sourceLongitude: 77.2167,
  destinationLatitude: 28.5494,
  destinationLongitude: 77.2001,
};

const draft: PublishCommuteDraft = {
  startLocation: 'Hauz Khas',
  officeLocation: 'Connaught Place',
  startLocationDetail: {
    placeName: 'Hauz Khas',
    address: 'Hauz Khas, Delhi',
    latitude: 28.5494,
    longitude: 77.2001,
  },
  officeLocationDetail: {
    placeName: 'Connaught Place',
    address: 'Connaught Place, Delhi',
    latitude: 28.6315,
    longitude: 77.2167,
  },
  departureDate: '20/12/2026',
  departureTime: '09:00',
  seats: 3,
  recurringDays: [],
  returningBack: false,
  returnDepartureTime: '',
  pricePerSeat: '80',
  routeSelection: outboundSelection,
  returnRouteSelection: null,
};

const vehicleId = '11111111-2222-3333-4444-555555555555';
const sunday = new Date(2026, 11, 20);

const mapped = mapPublishCommuteDraftToCreateRide(draft, vehicleId, sunday);
assertTrue(mapped.ok, 'single-date commute draft maps');
if (mapped.ok) {
  assertEqual(mapped.payload.rideType, 'COMMUTE', 'rideType COMMUTE');
  assertEqual(mapped.payload.routeSelectionToken, 'commute-token', 'token attached');
  assertEqual(mapped.payload.sourceLatitude, 28.5494, 'source lat matches selection');
  assertEqual(mapped.payload.destinationLongitude, 77.2167, 'dest lng matches selection');
  assertFalse('polyline' in mapped.payload, 'polyline is never sent as proof');
  assertFalse('recurring' in mapped.payload, 'single-date omits recurring');
  assertFalse('excludeWeekdays' in mapped.payload, 'single-date omits excludeWeekdays');
  assertFalse('returnEnabled' in mapped.payload, 'single-date omits returnEnabled');
  assertFalse(
    'returnRouteSelectionToken' in mapped.payload,
    'single-date omits return token',
  );
  assertEqual(mapped.payload.notes, null, 'recurrence is not stuffed into notes');
  assertFalse(
    commutePublishRequiresIdempotency(mapped.payload),
    'single-date commute does not require idempotency',
  );
}

const missing = mapPublishCommuteDraftToCreateRide(
  { ...draft, routeSelection: null },
  vehicleId,
  sunday,
);
assertFalse(missing.ok, 'commute publish blocked without explicit selection');
if (!missing.ok) {
  assertEqual(missing.message, ROUTE_SELECTION_USER_MESSAGES.required, 'requires explicit selection');
}

const stale = mapPublishCommuteDraftToCreateRide(
  {
    ...draft,
    startLocationDetail: {
      ...draft.startLocationDetail!,
      latitude: 28.6,
      longitude: 77.25,
    },
  },
  vehicleId,
  sunday,
);
assertFalse(stale.ok, 'endpoint change invalidates commute token');

const recurring = mapPublishCommuteDraftToCreateRide(
  { ...draft, recurringDays: ['sun', 'mon', 'tue'] },
  vehicleId,
  sunday,
);
assertTrue(recurring.ok, 'recurring commute maps when publish weekday is included');
if (recurring.ok) {
  assertEqual(recurring.payload.recurring, true, 'recurring true');
  assertEqual(
    recurring.payload.excludeWeekdays,
    excludeWeekdaysFromIncluded(['sun', 'mon', 'tue']),
    'excludeWeekdays are unselected weekdays',
  );
  assertEqual(
    recurring.payload.excludeWeekdays,
    ['WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    'backend weekday enum values',
  );
  assertTrue(
    commutePublishRequiresIdempotency(recurring.payload),
    'recurring commute requires idempotency',
  );
}

const excludedPublishDay = mapPublishCommuteDraftToCreateRide(
  { ...draft, recurringDays: ['mon', 'tue'] },
  vehicleId,
  sunday,
);
assertFalse(excludedPublishDay.ok, 'cannot exclude the publishing weekday');

const returnTooEarly = mapPublishCommuteDraftToCreateRide(
  {
    ...draft,
    returningBack: true,
    returnDepartureTime: '09:00',
    returnRouteSelection: returnSelection,
  },
  vehicleId,
  sunday,
);
assertFalse(returnTooEarly.ok, 'return time equal to outbound is rejected');
if (!returnTooEarly.ok) {
  assertEqual(
    returnTooEarly.message,
    COMMUTE_SERIES_COPY.returnTimeOrderMessage,
    'equal return time uses order message',
  );
}

const returnMissingTime = mapPublishCommuteDraftToCreateRide(
  {
    ...draft,
    returningBack: true,
    returnRouteSelection: returnSelection,
  },
  vehicleId,
  sunday,
);
assertFalse(returnMissingTime.ok, 'missing return time is rejected');

const returnStaleCoords = mapPublishCommuteDraftToCreateRide(
  {
    ...draft,
    returningBack: true,
    returnDepartureTime: '18:30',
    returnRouteSelection: {
      ...returnSelection,
      sourceLatitude: outboundSelection.sourceLatitude,
      sourceLongitude: outboundSelection.sourceLongitude,
      destinationLatitude: outboundSelection.destinationLatitude,
      destinationLongitude: outboundSelection.destinationLongitude,
    },
  },
  vehicleId,
  sunday,
);
assertFalse(returnStaleCoords.ok, 'return token is invalid when endpoints are not reversed');

const reusedOutboundToken = mapPublishCommuteDraftToCreateRide(
  {
    ...draft,
    returningBack: true,
    returnDepartureTime: '18:30',
    returnRouteSelection: {
      ...returnSelection,
      selectionToken: outboundSelection.selectionToken,
    },
  },
  vehicleId,
  sunday,
);
assertFalse(reusedOutboundToken.ok, 'outbound token cannot be reused for return');

const withReturn = mapPublishCommuteDraftToCreateRide(
  {
    ...draft,
    returningBack: true,
    returnDepartureTime: '18:30',
    returnRouteSelection: returnSelection,
  },
  vehicleId,
  sunday,
);
assertTrue(withReturn.ok, 'return-enabled commute maps');
if (withReturn.ok) {
  assertEqual(withReturn.payload.returnEnabled, true, 'returnEnabled true');
  assertEqual(withReturn.payload.returnDepartureTime, '18:30', 'returnDepartureTime');
  assertEqual(
    withReturn.payload.returnRouteSelectionToken,
    'commute-return-token',
    'separate reverse-route token',
  );
  assertTrue(
    withReturn.payload.returnRouteSelectionToken !== withReturn.payload.routeSelectionToken,
    'return token is not the outbound token',
  );
  assertEqual(withReturn.payload.returnSource, 'Connaught Place', 'returnSource swapped label');
  assertEqual(withReturn.payload.returnDestination, 'Hauz Khas', 'returnDestination swapped label');
  assertTrue(
    commutePublishRequiresIdempotency(withReturn.payload),
    'return-enabled commute requires idempotency',
  );
}

commutePublishIdempotencyStore.clear();
if (withReturn.ok) {
  const firstKey = commutePublishIdempotencyStore.resolve(withReturn.payload);
  const retryKey = commutePublishIdempotencyStore.resolve(withReturn.payload);
  assertEqual(retryKey, firstKey, 'same logical publish reuses idempotency key');

  const changed = {
    ...withReturn.payload,
    returnDepartureTime: '19:00',
  };
  const newKey = commutePublishIdempotencyStore.resolve(changed);
  assertTrue(newKey !== firstKey, 'changed payload gets a new idempotency key');
  commutePublishIdempotencyStore.clear();
  assertEqual(commutePublishIdempotencyStore.peek(), null, 'clear retires the key');
}

if (failed.length > 0) {
  throw new Error(`createCommuteRide.mapper tests failed:\n${failed.join('\n')}`);
}

console.log('createCommuteRide.mapper tests passed');
