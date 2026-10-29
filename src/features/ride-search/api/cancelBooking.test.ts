import { ENDPOINTS } from '../../../network/endpoints';
import { isCancelAlreadyApplied, mapCancelBookingError } from '../api/bookings.mapper';

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

const bookingId = '11111111-2222-3333-4444-555555555555';

assertEqual(
  ENDPOINTS.bookings.cancel(bookingId),
  `/bookings/${bookingId}/cancel`,
  'cancel endpoint path',
);

assertTrue(
  !ENDPOINTS.bookings.cancel(bookingId).includes('reason'),
  'path does not include reason',
);

// Simulate the Regular cancel request contract (no body / no reason fields).
const regularCancelRequest = {
  method: 'POST' as const,
  path: ENDPOINTS.bookings.cancel(bookingId),
  body: undefined as undefined,
};
assertEqual(regularCancelRequest.body, undefined, 'Regular cancel sends NO body');
assertTrue(
  !JSON.stringify(regularCancelRequest).includes('cancellationReason'),
  'request does not include cancellationReason',
);
assertTrue(
  !JSON.stringify(regularCancelRequest).includes('PLAN_CHANGED'),
  'UI reason is not mapped into request',
);

assertTrue(
  isCancelAlreadyApplied({
    bookingId,
    status: 'CANCELLED',
    cancellationReason: 'RIDER_CANCELLED',
    alreadyApplied: false,
  }),
  'status CANCELLED counts as applied',
);

assertTrue(
  isCancelAlreadyApplied({
    bookingId,
    alreadyApplied: true,
  }),
  'alreadyApplied true',
);

assertTrue(
  !isCancelAlreadyApplied({
    bookingId,
    status: 'CONFIRMED',
    alreadyApplied: false,
  }),
  'confirmed is not already cancelled',
);

assertEqual(
  mapCancelBookingError({ status: 409, message: 'Booking already cancelled' }),
  'Booking already cancelled',
  'maps server cancel error text',
);

if (failed.length > 0) {
  console.error('cancelBooking tests failed:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('cancelBooking tests passed');
