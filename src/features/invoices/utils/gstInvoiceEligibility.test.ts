import { isGstInvoiceActionVisible } from './gstInvoiceEligibility';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

const completedOutstation = {
  viewerRole: 'rider' as const,
  bookingStatus: 'COMPLETED',
  rideType: 'REGULAR',
  bookingMode: 'REGULAR',
  passengerUserId: 'rider-1',
  sessionUserId: 'rider-1',
};

assertEqual(
  isGstInvoiceActionVisible(completedOutstation),
  true,
  'completed outstation rider can see GST invoice',
);
assertEqual(
  isGstInvoiceActionVisible({
    ...completedOutstation,
    rideType: 'COMMUTE',
    bookingMode: 'COMMUTE',
  }),
  true,
  'completed commute rider can see GST invoice',
);
assertEqual(
  isGstInvoiceActionVisible({ ...completedOutstation, viewerRole: 'driver' }),
  false,
  'drivers do not see the rider invoice action',
);
assertEqual(
  isGstInvoiceActionVisible({
    ...completedOutstation,
    rideType: 'ASSURED',
    bookingMode: 'ASSURED',
  }),
  false,
  'assured bookings do not show the action',
);
assertEqual(
  isGstInvoiceActionVisible({ ...completedOutstation, bookingStatus: 'CANCELLED' }),
  false,
  'cancelled bookings do not show the action',
);
assertEqual(
  isGstInvoiceActionVisible({ ...completedOutstation, bookingStatus: 'NO_SHOW' }),
  false,
  'no-show bookings do not show the action',
);
assertEqual(
  isGstInvoiceActionVisible({ ...completedOutstation, bookingStatus: 'IN_PROGRESS' }),
  false,
  'active bookings do not show the action',
);
assertEqual(
  isGstInvoiceActionVisible({ ...completedOutstation, bookingStatus: 'CONFIRMED' }),
  false,
  'upcoming bookings do not show the action',
);
assertEqual(
  isGstInvoiceActionVisible({
    ...completedOutstation,
    passengerUserId: 'other-rider',
    sessionUserId: 'rider-1',
  }),
  false,
  'another rider cannot see this booking invoice',
);

if (failed.length > 0) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('gstInvoiceEligibility tests passed');
