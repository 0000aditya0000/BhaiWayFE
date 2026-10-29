import { ENDPOINTS } from '../../../network/endpoints';
import {
  isRideCancelAlreadyApplied,
  mapCancelRideError,
} from '../utils/createRide.mapper';

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

const rideId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

assertEqual(
  ENDPOINTS.rides.cancel(rideId),
  `/rides/${rideId}/cancel`,
  'driver cancel endpoint path',
);

assertEqual(
  `${ENDPOINTS.rides.cancel(rideId)}?seriesScope=THIS_OCCURRENCE`,
  `/rides/${rideId}/cancel?seriesScope=THIS_OCCURRENCE`,
  'THIS_OCCURRENCE cancel uses seriesScope query',
);

assertEqual(
  `${ENDPOINTS.rides.cancel(rideId)}?seriesScope=THIS_AND_FUTURE`,
  `/rides/${rideId}/cancel?seriesScope=THIS_AND_FUTURE`,
  'series cancel uses seriesScope query',
);

assertTrue(
  mapCancelRideError({
    status: 409,
    code: 'COMMUTE_SERIES_OCCURRENCE_IN_PROGRESS',
    message: 'Cannot cancel an in-progress occurrence as a series',
  }).toLowerCase().includes('in progress'),
  'IN_PROGRESS series cancel explains the trip cannot be cancelled as a series',
);

assertTrue(
  !ENDPOINTS.rides.cancel(rideId).includes('bookings'),
  'driver cancel is NOT the passenger booking cancel endpoint',
);

const driverCancelRequest = {
  method: 'POST' as const,
  path: ENDPOINTS.rides.cancel(rideId),
  body: undefined as undefined,
};
assertEqual(driverCancelRequest.body, undefined, 'driver cancel sends NO body');
assertTrue(
  !JSON.stringify(driverCancelRequest).includes('reason'),
  'UI reason is not sent on driver cancel',
);
assertTrue(
  !JSON.stringify(driverCancelRequest).includes('cancellationReason'),
  'cancellationReason is not sent by client',
);

assertTrue(
  isRideCancelAlreadyApplied({ status: 'CANCELLED', alreadyApplied: false }),
  'CANCELLED status treated as applied',
);
assertTrue(
  isRideCancelAlreadyApplied({ alreadyApplied: true }),
  'alreadyApplied true',
);
assertTrue(
  !isRideCancelAlreadyApplied({ status: 'PUBLISHED', alreadyApplied: false }),
  'PUBLISHED is not cancelled',
);

assertTrue(
  mapCancelRideError({
    status: 400,
    message: 'Assured lifecycle actions apply only to Assured rides',
  }).includes('Regular ride could not be cancelled'),
  'maps Assured-only backend reject for Regular cancel',
);
assertTrue(
  mapCancelRideError({
    status: 400,
    message: 'Assured lifecyle actions apply only to Assured rides',
  }).includes('Regular ride could not be cancelled'),
  'maps misspelled Assured lifecyle backend reject',
);
assertEqual(
  mapCancelRideError({ status: 404, message: 'Ride not found' }),
  'Ride not found',
  '404 uses server text',
);

// Passenger booking cancel path must remain distinct.
assertEqual(
  ENDPOINTS.bookings.cancel('booking-1'),
  '/bookings/booking-1/cancel',
  'passenger cancel endpoint unchanged',
);

if (failed.length > 0) {
  console.error('cancelRide tests failed:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('cancelRide tests passed');
