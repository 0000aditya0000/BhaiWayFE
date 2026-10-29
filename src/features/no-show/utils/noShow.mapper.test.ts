import { ENDPOINTS } from '../../../network/endpoints';
import {
  extractNoShowErrorSupport,
  formatNoShowKindLabel,
  formatNoShowStatusLabel,
  formatRemainingRespondLabel,
  isNoShowAlreadyRejectedError,
  normalizeNoShowClaim,
  remainingRespondMs,
  unwrapNoShowClaimRoot,
} from './noShow.mapper';
import {
  acquireNoShowActionLock,
  releaseNoShowActionLock,
  resolvePassengerNoShowBookingId,
} from './noShow.actions';
import {
  canDriverReportPassengerNoShow,
  canPassengerReportDriverNoShow,
  canRespondToNoShowClaim,
  isPendingNoShowStatus,
} from './noShow.visibility';
import { noShowClaimStore } from '../store/noShowClaimStore';

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

const CLAIM_ID = '11111111-1111-4111-8111-111111111111';
const RIDE_ID = '22222222-2222-4222-8222-222222222222';
const BOOKING_A = '33333333-3333-4333-8333-333333333333';
const BOOKING_B = '44444444-4444-4444-8444-444444444444';
const USER_A = '55555555-5555-4555-8555-555555555555';
const USER_B = '66666666-6666-4666-8666-666666666666';

const rootDto = {
  id: CLAIM_ID,
  rideId: RIDE_ID,
  bookingId: BOOKING_A,
  rideType: 'REGULAR',
  kind: 'DRIVER_NO_SHOW',
  claimantUserId: USER_A,
  respondentUserId: USER_B,
  status: 'PENDING',
  respondBy: '2026-10-28T10:15:00.000Z',
  respondedAt: null,
  respondedByUserId: null,
  decisionSource: null,
  settledAt: null,
  settlementIdempotencyKey: null,
  supportTicketId: null,
  createdAt: '2026-10-28T10:00:00.000Z',
  updatedAt: '2026-10-28T10:00:00.000Z',
  alreadyOpen: false,
  support: null,
  effects: [
    {
      kind: 'NOTIFY_RESOLVED',
      status: 'PENDING',
      attemptCount: 0,
      nextAttemptAt: null,
      lastError: null,
      completedAt: null,
    },
  ],
};

assertEqual(
  ENDPOINTS.rides.driverNoShow(RIDE_ID),
  `/rides/${RIDE_ID}/no-show/driver`,
  'driver no-show endpoint',
);
assertEqual(
  ENDPOINTS.bookings.passengerNoShow(BOOKING_A),
  `/bookings/${BOOKING_A}/no-show/passenger`,
  'passenger no-show endpoint uses booking A',
);
assertEqual(
  ENDPOINTS.bookings.passengerNoShow(BOOKING_B),
  `/bookings/${BOOKING_B}/no-show/passenger`,
  'passenger no-show endpoint uses booking B',
);
assertTrue(
  ENDPOINTS.bookings.passengerNoShow(BOOKING_A) !==
    ENDPOINTS.bookings.passengerNoShow(BOOKING_B),
  'multi-passenger bookings resolve distinct ids',
);
assertEqual(
  ENDPOINTS.noShowClaims.byId(CLAIM_ID),
  `/no-show-claims/${CLAIM_ID}`,
  'get claim endpoint',
);
assertEqual(
  ENDPOINTS.noShowClaims.approve(CLAIM_ID),
  `/no-show-claims/${CLAIM_ID}/approve`,
  'approve endpoint',
);
assertEqual(
  ENDPOINTS.noShowClaims.reject(CLAIM_ID),
  `/no-show-claims/${CLAIM_ID}/reject`,
  'reject endpoint',
);

const unwrappedRoot = unwrapNoShowClaimRoot(rootDto);
assertEqual(unwrappedRoot?.id, CLAIM_ID, 'unwraps root DTO');
assertEqual(
  unwrapNoShowClaimRoot({ data: rootDto })?.id,
  CLAIM_ID,
  'unwraps { data } envelope',
);
assertEqual(
  unwrapNoShowClaimRoot({ claim: rootDto })?.id,
  CLAIM_ID,
  'unwraps { claim } envelope',
);

const mapped = normalizeNoShowClaim(rootDto);
assertTrue(Boolean(mapped), 'normalizes root DTO');
assertEqual(mapped?.id, CLAIM_ID, 'claim id');
assertEqual(mapped?.respondBy, '2026-10-28T10:15:00.000Z', 'respondBy from DTO');
assertEqual(mapped?.alreadyOpen, false, 'alreadyOpen');
assertEqual(mapped?.claimantName, null, 'claimantName omitted when API does not send it');
assertEqual(mapped?.effects[0]?.kind, 'NOTIFY_RESOLVED', 'effects parsed but not for UI');
assertEqual(
  normalizeNoShowClaim({ data: { claim: rootDto } })?.id,
  CLAIM_ID,
  'unwraps nested data.claim',
);
assertEqual(
  normalizeNoShowClaim({
    ...rootDto,
    claimantName: 'Priya',
  })?.claimantName,
  'Priya',
  'maps claimantName only when present',
);

assertEqual(formatNoShowStatusLabel('PENDING'), 'Pending', 'pending label');
assertEqual(formatNoShowStatusLabel('APPROVED'), 'Approved', 'approved label');
assertEqual(formatNoShowStatusLabel('REJECTED'), 'Rejected', 'rejected label');
assertEqual(formatNoShowStatusLabel('SUPERSEDED'), 'Closed', 'superseded label');
assertEqual(formatNoShowKindLabel('DRIVER_NO_SHOW'), 'Driver no-show', 'driver kind');
assertEqual(formatNoShowKindLabel('PASSENGER_NO_SHOW'), 'Passenger no-show', 'passenger kind');
assertTrue(isPendingNoShowStatus('PENDING'), 'PENDING is pending');
assertFalse(isPendingNoShowStatus('APPROVED'), 'APPROVED is not pending');
assertFalse(isPendingNoShowStatus('SUPERSEDED'), 'SUPERSEDED is not pending');
assertFalse(isPendingNoShowStatus('REJECTED'), 'REJECTED is not pending');

assertEqual(formatRemainingRespondLabel(90_000), '1:30', 'countdown format');
assertEqual(
  remainingRespondMs('2026-10-28T10:00:00.000Z', Date.parse('2026-10-28T09:59:00.000Z')),
  60_000,
  'remaining ms from respondBy',
);
assertEqual(
  remainingRespondMs('not-a-date'),
  null,
  'invalid respondBy does not invent a timer',
);

assertTrue(
  canPassengerReportDriverNoShow({
    hasOwnBooking: true,
    isRideOwner: false,
    bookingStatus: 'CONFIRMED',
  }),
  'passenger with confirmed booking can report',
);
assertFalse(
  canPassengerReportDriverNoShow({
    hasOwnBooking: true,
    isRideOwner: true,
    bookingStatus: 'CONFIRMED',
  }),
  'driver of own ride cannot report driver no-show',
);
assertFalse(
  canPassengerReportDriverNoShow({
    hasOwnBooking: false,
    isRideOwner: false,
    bookingStatus: 'CONFIRMED',
  }),
  'unrelated user without booking cannot report',
);
assertFalse(
  canPassengerReportDriverNoShow({
    hasOwnBooking: true,
    isRideOwner: false,
    bookingStatus: 'CANCELLED',
  }),
  'cancelled booking cannot report',
);
assertFalse(
  canPassengerReportDriverNoShow({
    hasOwnBooking: true,
    isRideOwner: false,
    bookingStatus: 'COMPLETED',
  }),
  'completed booking cannot report',
);
assertFalse(
  canPassengerReportDriverNoShow({
    hasOwnBooking: true,
    isRideOwner: false,
    bookingStatus: 'CONFIRMED',
    rideStatus: 'COMPLETED',
  }),
  'completed ride cannot report',
);
assertFalse(
  canPassengerReportDriverNoShow({
    hasOwnBooking: true,
    isRideOwner: false,
    bookingStatus: 'CONFIRMED',
    pickupStatus: 'PICKED_UP',
  }),
  'picked-up passenger cannot report driver no-show',
);

assertTrue(
  canDriverReportPassengerNoShow({
    isRideOwner: true,
    bookingId: BOOKING_A,
    bookingStatus: 'CONFIRMED',
  }),
  'driver can report the current pickup booking',
);
assertFalse(
  canDriverReportPassengerNoShow({
    isRideOwner: true,
    bookingId: '',
    bookingStatus: 'CONFIRMED',
  }),
  'driver cannot report without a booking id',
);
assertFalse(
  canDriverReportPassengerNoShow({
    isRideOwner: false,
    bookingId: BOOKING_A,
    bookingStatus: 'CONFIRMED',
  }),
  'non-driver cannot report passenger no-show',
);
assertFalse(
  canDriverReportPassengerNoShow({
    isRideOwner: true,
    bookingId: BOOKING_A,
    bookingStatus: 'CONFIRMED',
    pickupStatus: 'PICKED_UP',
  }),
  'driver cannot report after pickup',
);

assertTrue(
  canRespondToNoShowClaim({
    claimStatus: 'PENDING',
    currentUserId: USER_B,
    respondentUserId: USER_B,
    claimantUserId: USER_A,
  }),
  'respondent can approve/reject pending claim',
);
assertFalse(
  canRespondToNoShowClaim({
    claimStatus: 'PENDING',
    currentUserId: USER_A,
    respondentUserId: USER_B,
    claimantUserId: USER_A,
  }),
  'claimant cannot approve/reject own claim',
);
assertFalse(
  canRespondToNoShowClaim({
    claimStatus: 'APPROVED',
    currentUserId: USER_B,
    respondentUserId: USER_B,
    claimantUserId: USER_A,
  }),
  'approved claim is not actionable',
);
assertFalse(
  canRespondToNoShowClaim({
    claimStatus: 'SUPERSEDED',
    currentUserId: USER_B,
    respondentUserId: USER_B,
    claimantUserId: USER_A,
  }),
  'superseded claim is not actionable',
);

assertEqual(resolvePassengerNoShowBookingId(BOOKING_A), BOOKING_A, 'stop id is booking id');
assertEqual(resolvePassengerNoShowBookingId('empty'), '', 'placeholder stop is not posted');
assertEqual(resolvePassengerNoShowBookingId(''), '', 'blank stop is not posted');
assertTrue(
  resolvePassengerNoShowBookingId(BOOKING_A) !== resolvePassengerNoShowBookingId(BOOKING_B),
  'multi-passenger OTP targets distinct bookings',
);

const lock = { current: false };
assertTrue(acquireNoShowActionLock(lock), 'first tap acquires lock');
assertFalse(acquireNoShowActionLock(lock), 'repeated tap is rejected');
releaseNoShowActionLock(lock);
assertTrue(acquireNoShowActionLock(lock), 'lock releases after request finishes');
releaseNoShowActionLock(lock);

assertTrue(
  isNoShowAlreadyRejectedError({
    status: 409,
    code: 'NO_SHOW_CLAIM_ALREADY_REJECTED',
    message: 'Already rejected',
  }),
  'maps already-rejected conflict',
);
assertEqual(
  extractNoShowErrorSupport({
    status: 409,
    code: 'NO_SHOW_CLAIM_ALREADY_REJECTED',
    message: 'Already rejected',
    details: {
      support: {
        category: 'RIDES',
        subcategory: 'NO_SHOW',
        message: 'Contact Help & Support',
        ticketId: null,
      },
    },
  })?.message,
  'Contact Help & Support',
  'reads support hint from error details',
);

noShowClaimStore.clear();
noShowClaimStore.remember({
  claimId: CLAIM_ID,
  rideId: RIDE_ID,
  bookingId: BOOKING_A,
  kind: 'PASSENGER_NO_SHOW',
});
assertEqual(
  noShowClaimStore.findForContext({ rideId: RIDE_ID, bookingId: BOOKING_A })?.claimId,
  CLAIM_ID,
  'store matches the selected booking',
);
assertEqual(
  noShowClaimStore.findForContext({ rideId: RIDE_ID, bookingId: BOOKING_B }),
  null,
  'store does not reuse another passenger booking claim',
);

if (failed.length > 0) {
  throw new Error(`no-show tests failed:\n${failed.join('\n')}`);
}

console.log('no-show mapper/visibility/store tests passed');
