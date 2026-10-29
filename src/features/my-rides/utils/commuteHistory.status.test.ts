import { isUpcomingDriverRideStatus } from '@/features/offer-ride/utils/mapRideStatusLabel';
import { COMMUTE_SERIES_COPY } from '@/features/office-commute/constants/commute-series.constants';

import { isCommuteApiRide, isCommuteHistoryCard } from './commuteMyRides.utils';
import {
  isCancelledHistoryStatus,
  isCompletedHistoryStatus,
  mapHistoryStatusLabel,
  normalizeHistoryStatus,
  resolveHistoryCancelledAt,
  resolveHistoryStatusFromDto,
} from './historyStatus';

const isHistoryRideStatus = (status: string | undefined): boolean => {
  const value = normalizeHistoryStatus(status);
  return value === 'COMPLETED' || value === 'CANCELLED';
};

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
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

const nestedOutbound = {
  ride: {
    id: 'out-1',
    rideType: 'COMMUTE',
    status: 'CANCELLED',
    direction: 'OUTBOUND',
    cancelledAt: '2026-10-28T10:15:00.000Z',
  },
  vehicle: { make: 'Honda' },
  passengerCount: 0,
};

const nestedReturn = {
  ride: {
    id: 'ret-1',
    rideType: 'COMMUTE',
    status: 'CANCELLED',
    direction: 'RETURN',
    cancelledAt: '2026-10-28T10:16:00.000Z',
  },
};

assertTrue(isCommuteApiRide(nestedOutbound), 'nested commute outbound is a commute history item');
assertTrue(isCommuteApiRide(nestedReturn), 'nested commute return is a commute history item');
assertFalse(
  isCommuteApiRide({ rideType: 'REGULAR', ride: { rideType: 'REGULAR' } }),
  'regular rides stay on the outstation Past list',
);

assertEqual(
  resolveHistoryStatusFromDto(nestedOutbound),
  'CANCELLED',
  'nested CANCELLED stays CANCELLED',
);
assertEqual(
  resolveHistoryStatusFromDto(nestedReturn),
  'CANCELLED',
  'nested return CANCELLED stays CANCELLED',
);
assertEqual(
  resolveHistoryStatusFromDto({
    status: '',
    cancelledAt: '',
    ride: {
      status: 'CANCELLED',
      cancelledAt: '2026-10-28T10:15:00.000Z',
    },
  }),
  'CANCELLED',
  'empty wrapper status still reads nested CANCELLED',
);
assertEqual(
  resolveHistoryCancelledAt({
    cancelledAt: '',
    ride: { cancelledAt: '2026-10-28T10:15:00.000Z' },
  }),
  '2026-10-28T10:15:00.000Z',
  'uses backend cancelledAt from nested ride',
);
assertEqual(
  resolveHistoryStatusFromDto({ status: 'COMPLETED', ride: { status: 'COMPLETED' } }),
  'COMPLETED',
  'completed stays completed',
);
assertEqual(
  resolveHistoryStatusFromDto({
    status: 'CANCELLED',
    ride: { status: 'COMPLETED', cancelledAt: '2026-10-28T10:00:00.000Z' },
  }),
  'CANCELLED',
  'never maps CANCELLED to COMPLETED even if nested completedAt-like status exists',
);
assertEqual(
  mapHistoryStatusLabel(resolveHistoryStatusFromDto(nestedOutbound), {
    cancelledAt: resolveHistoryCancelledAt(nestedOutbound),
  }),
  'Cancelled',
  'Past Rides badge for cancelled commute is Cancelled',
);
assertEqual(
  mapHistoryStatusLabel('COMPLETED'),
  'Completed',
  'completed rides keep Completed',
);

assertTrue(isCancelledHistoryStatus('CANCELLED'), 'CANCELLED is a cancelled history status');
assertTrue(isCompletedHistoryStatus('COMPLETED'), 'COMPLETED is a completed history status');
assertTrue(isHistoryRideStatus('CANCELLED'), 'cancelled rides belong in Past Rides');
assertTrue(isHistoryRideStatus('COMPLETED'), 'completed rides belong in Past Rides');
assertFalse(isHistoryRideStatus('PUBLISHED'), 'published rides are not Past Rides');
assertFalse(isHistoryRideStatus('IN_PROGRESS'), 'in-progress rides are not Past Rides');

assertFalse(
  isUpcomingDriverRideStatus('CANCELLED'),
  'cancelled rides are excluded from Upcoming',
);
assertFalse(isUpcomingDriverRideStatus('COMPLETED'), 'completed rides are excluded from Upcoming');
assertTrue(isUpcomingDriverRideStatus('PUBLISHED'), 'published rides stay Upcoming');
assertTrue(isUpcomingDriverRideStatus('IN_PROGRESS'), 'in-progress rides stay Upcoming');

assertTrue(
  isCommuteHistoryCard({ commute: true }),
  'mapped commute history cards stay on office-commute Past',
);
assertFalse(
  isCommuteHistoryCard({ commute: false }),
  'regular/assured history cards stay off office-commute Past',
);

assertTrue(
  COMMUTE_SERIES_COPY.cancelScopeMessage.toLowerCase().includes('outbound') &&
    COMMUTE_SERIES_COPY.cancelScopeMessage.toLowerCase().includes('return'),
  'series cancel UX mentions outbound and return',
);

if (failed.length > 0) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('commuteHistory.status.test.ts passed');
