import type { HistoryRideItem, UpcomingRideSummary } from '../types';
import {
  mergeSortedHistoryRides,
  parseCivilDateTimeMs,
  parseIsoTimestampMs,
  resolveHistoryEndedMs,
  sortHistoryRidesByLatest,
  sortUpcomingRidesByNearest,
} from './sortMyRides';

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

assertEqual(parseCivilDateTimeMs('', '09:00'), null, 'missing date is not sortable');
assertEqual(parseCivilDateTimeMs('not-a-date', '09:00'), null, 'invalid date is not sortable');
assertTrue(parseIsoTimestampMs('nope') == null, 'invalid ISO is not sortable');

const oct30 = parseCivilDateTimeMs('2026-10-30', '09:00');
const oct31 = parseCivilDateTimeMs('2026-10-31', '08:00');
const nov2 = parseCivilDateTimeMs('2026-11-02', '07:00');
assertTrue(oct30 != null && oct31 != null && nov2 != null, 'civil dates parse');
assertTrue((oct30 as number) < (oct31 as number), '30 Oct before 31 Oct');
assertTrue((oct31 as number) < (nov2 as number), '31 Oct before 2 Nov');

const slashMs = parseCivilDateTimeMs('30/10/2026', '9:00 AM');
assertEqual(slashMs, oct30, 'slash + 12h time matches civil HH:mm');

const peer = {
  name: 'Peer',
  vehicleLabel: 'Car',
  plateNumber: '',
  avatarUri: '',
  verified: false,
};

const upcoming = (
  id: string,
  date: string,
  time: string,
  role: UpcomingRideSummary['role'] = 'rider',
): UpcomingRideSummary => ({
  id,
  dateLabel: `${date} ${time}`,
  title: id,
  assured: false,
  otp: '',
  pickupLabel: 'A',
  dropoffLabel: 'B',
  pickup: null,
  dropoff: null,
  peer,
  driver: peer,
  role,
  sortAtMs: parseCivilDateTimeMs(date, time),
});

const upcomingSorted = sortUpcomingRidesByNearest([
  upcoming('nov-2', '2026-11-02', '07:00', 'driver'),
  upcoming('oct-31', '2026-10-31', '08:00', 'rider'),
  upcoming('oct-30', '2026-10-30', '09:00', 'driver'),
  upcoming('missing', '', ''),
]);
assertEqual(
  upcomingSorted.map((ride) => ride.id),
  ['oct-30', 'oct-31', 'nov-2', 'missing'],
  'nearest upcoming first; missing last',
);

const laterCompleted = resolveHistoryEndedMs({
  completedAt: '2026-10-28T18:00:00.000Z',
  departureDate: '2026-10-20',
  departureTime: '09:00',
});
const earlierCompleted = resolveHistoryEndedMs({
  completedAt: '2026-10-21T12:00:00.000Z',
  departureDate: '2026-10-21',
  departureTime: '09:00',
});
assertTrue(
  laterCompleted != null &&
    earlierCompleted != null &&
    laterCompleted > earlierCompleted,
  'completedAt beats older departure',
);

const cancelledFallback = resolveHistoryEndedMs({
  cancelledAt: '2026-10-22T11:00:00.000Z',
  departureDate: '2026-10-30',
  departureTime: '09:00',
});
const departureOnly = resolveHistoryEndedMs({
  departureDate: '2026-10-30',
  departureTime: '09:00',
});
assertTrue(
  cancelledFallback != null &&
    departureOnly != null &&
    cancelledFallback < departureOnly,
  'cancelledAt preferred over later departure',
);

const history = (
  id: string,
  sortAtMs: number | null,
  role: HistoryRideItem['role'] = 'rider',
): HistoryRideItem => ({
  id,
  title: id,
  routeLabel: 'A → B',
  dateLabel: id,
  statusLabel: 'Completed',
  pickupLabel: 'A',
  dropoffLabel: 'B',
  pickup: null,
  dropoff: null,
  role,
  sortAtMs,
});

const pastSorted = sortHistoryRidesByLatest([
  history('old', earlierCompleted, 'driver'),
  history('missing', null, 'rider'),
  history('recent', laterCompleted, 'driver'),
]);
assertEqual(
  pastSorted.map((ride) => ride.id),
  ['recent', 'old', 'missing'],
  'most recent past first; missing last',
);

const page1 = [history('old', earlierCompleted, 'driver')];
const page2 = [
  history('recent', laterCompleted, 'rider'),
  history('old', earlierCompleted, 'driver'),
];
assertEqual(
  mergeSortedHistoryRides(page1, page2).map((ride) => ride.id),
  ['recent', 'old'],
  'pagination merge re-sorts accumulated pages and dedupes',
);

const cancelledOutbound = history('commute-out', laterCompleted, 'driver');
cancelledOutbound.statusLabel = 'Cancelled';
cancelledOutbound.status = 'CANCELLED';
cancelledOutbound.commute = true;
cancelledOutbound.direction = 'OUTBOUND';
const cancelledReturn = history('commute-ret', earlierCompleted, 'driver');
cancelledReturn.statusLabel = 'Cancelled';
cancelledReturn.status = 'CANCELLED';
cancelledReturn.commute = true;
cancelledReturn.direction = 'RETURN';
const completedRegular = history('regular-done', earlierCompleted, 'driver');
completedRegular.statusLabel = 'Completed';
completedRegular.status = 'COMPLETED';
completedRegular.commute = false;

const refreshedPast = mergeSortedHistoryRides(
  [cancelledOutbound, completedRegular],
  [cancelledOutbound, cancelledReturn, completedRegular],
);
assertEqual(
  refreshedPast.map((ride) => ride.id),
  ['commute-out', 'commute-ret', 'regular-done'],
  'refresh merge keeps cancelled outbound/return and completed non-series without duplicates',
);
assertEqual(
  refreshedPast.find((ride) => ride.id === 'commute-out')?.statusLabel,
  'Cancelled',
  'cancelled outbound stays Cancelled after merge',
);
assertEqual(
  refreshedPast.find((ride) => ride.id === 'regular-done')?.statusLabel,
  'Completed',
  'completed Regular ordering/status is preserved',
);

try {
  sortUpcomingRidesByNearest([upcoming('ok', '2026-10-30', '09:00')]);
  sortHistoryRidesByLatest([history('ok', null)]);
  mergeSortedHistoryRides([], [history('ok', Number.NaN)]);
} catch (error) {
  failed.push(`missing timestamps must not throw: ${String(error)}`);
}

if (failed.length > 0) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('sortMyRides.test.ts passed');
