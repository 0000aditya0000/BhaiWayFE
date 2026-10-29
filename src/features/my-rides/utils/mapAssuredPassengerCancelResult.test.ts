/**
 * Assured passenger cancel display mapper tests.
 */
import {
  mapAssuredPassengerCancelDisplay,
} from './mapAssuredPassengerCancelResult';

const failed: string[] = [];

const assertTrue = (value: boolean, label: string): void => {
  if (!value) failed.push(`${label}: expected true`);
};

const assertIncludes = (haystack: string, needle: string, label: string): void => {
  if (!haystack.includes(needle)) {
    failed.push(`${label}: missing ${needle}`);
  }
};

const assertNotIncludes = (haystack: string, needle: string, label: string): void => {
  if (haystack.includes(needle)) {
    failed.push(`${label}: should not contain ${needle}`);
  }
};

const payLaterDto = {
  bookingId: 'b1',
  rideId: 'r1',
  status: 'CANCELLED',
  securityDepositForfeited: '35',
  farePayment: 'PAY_LATER',
  fareRefunded: '0',
  driverCompensation: '35',
  platformAmount: '0',
  nextAssuredDepositPercentage: 10,
};

const payLater = mapAssuredPassengerCancelDisplay(payLaterDto);

assertIncludes(payLater.lines.join('\n'), '₹35', 'PAY_LATER deposit');
assertIncludes(payLater.lines.join('\n'), 'driver as compensation', 'PAY_LATER compensation');
assertIncludes(payLater.lines.join('\n'), '10%', 'PAY_LATER next deposit');
assertNotIncludes(payLater.lines.join('\n'), 'non-refundable', 'PAY_LATER no fare line');

const payNow = mapAssuredPassengerCancelDisplay({
  bookingId: 'b2',
  rideId: 'r2',
  status: 'CANCELLED',
  securityDepositForfeited: '35',
  farePayment: 'PAY_NOW',
  fareRefunded: '0',
  driverCompensation: '245',
  platformAmount: '490',
  nextAssuredDepositPercentage: 10,
});

assertIncludes(payNow.lines.join('\n'), 'non-refundable', 'PAY_NOW fare non-refundable');
assertIncludes(payNow.lines.join('\n'), '₹700', 'PAY_NOW fare amount from backend fields');
assertNotIncludes(payNow.lines.join('\n'), 'fare has been refunded', 'PAY_NOW no refund line');

const idempotent = mapAssuredPassengerCancelDisplay({
  ...payLaterDto,
  alreadyApplied: true,
});
assertTrue(idempotent.lines.length > 0, 'alreadyApplied still renders result lines');

if (failed.length > 0) {
  console.error('mapAssuredPassengerCancelResult tests failed:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('mapAssuredPassengerCancelResult tests passed');
