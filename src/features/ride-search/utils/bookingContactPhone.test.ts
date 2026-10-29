import type { BookingResponseDto } from '../api/bookings.types';
import {
  resolveDriverContactPhone,
  resolvePassengerContactPhone,
  resolveRidePeerContactPhone,
} from './bookingContactPhone';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const booking = {
  id: 'b1',
  rideId: 'r1',
  passengerId: 'p1',
  seats: 1,
  status: 'CONFIRMED',
  paymentMethod: 'PAY_LATER',
  paymentStatus: 'UNPAID',
  pricePerSeatSnapshot: '100',
  totalAmount: '100',
  driver: {
    id: 'd1',
    phone: '+919111111111',
  },
  passenger: {
    id: 'p1',
    phoneNumber: '9222222222',
  },
} as BookingResponseDto;

assertEqual(resolveDriverContactPhone(booking), '+919111111111', 'driver.phone');
assertEqual(resolvePassengerContactPhone(booking), '9222222222', 'passenger.phoneNumber');
assertEqual(
  resolveRidePeerContactPhone(booking, 'rider'),
  '+919111111111',
  'rider calls driver',
);
assertEqual(
  resolveRidePeerContactPhone(booking, 'driver'),
  '9222222222',
  'driver calls passenger',
);

const empty = {
  ...booking,
  driver: { id: 'd1' },
  passenger: { id: 'p1' },
} as BookingResponseDto;

assertEqual(resolveDriverContactPhone(empty), '', 'no invented driver phone');
assertEqual(resolvePassengerContactPhone(empty), '', 'no invented passenger phone');

if (failed.length > 0) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('bookingContactPhone.test.ts passed');
