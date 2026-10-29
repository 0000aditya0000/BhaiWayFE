import type { RideResponseDto } from '@/features/offer-ride/api/rides.types';
import { SERIES_SCOPE } from '@/features/offer-ride/api/rides.types';
import { COMMUTE_SERIES_COPY } from '../constants/commute-series.constants';
import {
  isAmbiguousPublishNetworkError,
  isCommuteSeriesOccurrenceInProgressError,
  isReturnTimeAfterOutbound,
  summarizeCommutePublish,
  summarizeCommuteSeriesCancel,
  toggleRecurringDay,
  weekdayIdFromCivilDate,
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

assertEqual(weekdayIdFromCivilDate('2026-12-20'), 'sun', '20 Dec 2026 is Sunday');
assertEqual(weekdayIdFromCivilDate('2026-10-29'), 'thu', '29 Oct 2026 is Thursday');

assertTrue(isReturnTimeAfterOutbound('09:00', '18:30'), 'later return time is valid');
assertFalse(isReturnTimeAfterOutbound('09:00', '09:00'), 'equal return time is invalid');
assertFalse(isReturnTimeAfterOutbound('09:00', '08:59'), 'earlier return time is invalid');

const blocked = toggleRecurringDay(['sun', 'mon'], 'sun', 'sun');
assertFalse(blocked.ok, 'cannot unselect publishing weekday while others remain');

const allowedOff = toggleRecurringDay(['sun'], 'sun', 'sun');
assertTrue(allowedOff.ok, 'unselecting the only remaining day disables recurring');
if (allowedOff.ok) {
  assertEqual(allowedOff.next, [], 'recurring days empty');
}

const explained = toggleRecurringDay(['mon'], 'tue', 'sun');
assertTrue(explained.ok, 'selecting another day keeps publish weekday');
if (explained.ok) {
  assertTrue(explained.next.includes('sun'), 'publish weekday auto-included');
  assertTrue(explained.explainedPublishWeekday, 'explains why publish weekday stayed');
}

assertTrue(
  isAmbiguousPublishNetworkError({ status: 0, code: 'TIMEOUT', message: 'timed out' }),
  'timeout is ambiguous',
);
assertTrue(
  isAmbiguousPublishNetworkError({ status: 0, code: 'NETWORK_ERROR', message: '' }),
  'network error is ambiguous',
);
assertFalse(
  isAmbiguousPublishNetworkError({ status: 409, code: 'HTTP_409', message: 'conflict' }),
  '409 is not an ambiguous timeout',
);

const created = {
  id: 'ride-original',
  seriesId: 'series-1',
  direction: 'OUTBOUND',
  occurrenceDate: '2026-10-29',
  departureDate: '2026-10-29',
  series: {
    id: 'series-1',
    status: 'ACTIVE',
    startDate: '2026-10-29',
    endDate: '2026-11-04',
    excludedWeekdays: [],
    returnEnabled: true,
    occurrences: [
      {
        id: 'ride-out-1',
        direction: 'OUTBOUND',
        occurrenceDate: '2026-10-29',
        departureDate: '2026-10-29',
      },
      {
        id: 'ride-ret-1',
        direction: 'RETURN',
        occurrenceDate: '2026-10-29',
        departureDate: '2026-10-29',
      },
      {
        id: 'ride-out-2',
        direction: 'OUTBOUND',
        occurrenceDate: '2026-10-30',
        departureDate: '2026-10-30',
      },
    ],
  },
} as unknown as RideResponseDto;

const summary = summarizeCommutePublish(created);
assertEqual(summary.rideId, 'ride-original', 'uses original ride id from response');
assertEqual(summary.seriesId, 'series-1', 'series id from response');
assertEqual(summary.outboundCount, 2, 'counts outbound occurrences');
assertEqual(summary.returnCount, 1, 'counts return occurrences');
assertTrue(summary.occurrenceDates.includes('2026-10-29'), 'uses backend occurrence dates');
assertTrue(summary.message.includes('ride-original') === false, 'message does not invent ids');
assertTrue(summary.message.toLowerCase().includes('outbound'), 'summary mentions outbound');

assertEqual(SERIES_SCOPE.THIS_OCCURRENCE, 'THIS_OCCURRENCE', 'edit/cancel this occurrence');
assertEqual(SERIES_SCOPE.THIS_AND_FUTURE, 'THIS_AND_FUTURE', 'edit/cancel this and future');

assertTrue(
  COMMUTE_SERIES_COPY.cancelThisOnly.toLowerCase().includes('this ride only'),
  'THIS_OCCURRENCE keeps this-ride-only CTA',
);
assertTrue(
  COMMUTE_SERIES_COPY.cancelScopeMessage.toLowerCase().includes('this ride only'),
  'scope dialog explains THIS_OCCURRENCE',
);
assertTrue(
  COMMUTE_SERIES_COPY.cancelScopeMessage.toLowerCase().includes('outbound') &&
    COMMUTE_SERIES_COPY.cancelScopeMessage.toLowerCase().includes('return'),
  'THIS_AND_FUTURE copy mentions outbound and return occurrences',
);
assertTrue(
  COMMUTE_SERIES_COPY.cancelScopeMessage.toLowerCase().includes('later dates') ||
    COMMUTE_SERIES_COPY.cancelScopeMessage.toLowerCase().includes('later date'),
  'THIS_AND_FUTURE copy mentions selected and later dates',
);

const thisOccurrenceCancel = summarizeCommuteSeriesCancel({
  cancelledRideIds: ['ride-1'],
  skippedBookedRideIds: [],
  skippedIneligibleRideIds: [],
});
assertEqual(thisOccurrenceCancel.cancelledCount, 1, 'THIS_OCCURRENCE reads cancelledRideIds');
assertFalse(thisOccurrenceCancel.showSkipAlert, 'THIS_OCCURRENCE with no skips uses success screen');

const skippedBooked = summarizeCommuteSeriesCancel({
  cancelledRideIds: ['out-1', 'ret-1'],
  skippedBookedRideIds: ['booked-1', 'booked-1'],
  skippedIneligibleRideIds: [],
});
assertEqual(skippedBooked.cancelledCount, 2, 'reads unique cancelledRideIds');
assertEqual(skippedBooked.skippedBookedCount, 1, 'dedupes skippedBookedRideIds');
assertTrue(skippedBooked.showSkipAlert, 'booked skips show an alert');
assertTrue(
  skippedBooked.message.toLowerCase().includes('bookings'),
  'booked skip copy mentions bookings',
);
assertTrue(skippedBooked.message.includes('2 unbooked'), 'includes cancelledRideIds count');

const skippedIneligible = summarizeCommuteSeriesCancel({
  cancelledRideIds: ['out-2'],
  skippedBookedRideIds: [],
  skippedIneligibleRideIds: ['in-progress-1'],
});
assertEqual(skippedIneligible.skippedIneligibleCount, 1, 'reads skippedIneligibleRideIds');
assertTrue(
  skippedIneligible.message.toLowerCase().includes('in progress'),
  'ineligible skip copy mentions in-progress trips',
);
assertFalse(
  skippedIneligible.message.toLowerCase().includes('all future'),
  'does not claim the whole series was cancelled',
);

const bothSkips = summarizeCommuteSeriesCancel({
  cancelledRideIds: [],
  skippedBookedRideIds: ['booked-1'],
  skippedIneligibleRideIds: ['live-1', 'live-2'],
});
assertTrue(bothSkips.message.toLowerCase().includes('bookings'), 'combined skips mention bookings');
assertTrue(
  bothSkips.message.toLowerCase().includes('in progress'),
  'combined skips mention in-progress trips',
);
assertTrue(
  bothSkips.message.toLowerCase().includes('no other rides were cancelled'),
  'empty cancelledRideIds is stated, not assumed cancelled',
);

assertTrue(
  isCommuteSeriesOccurrenceInProgressError({
    status: 409,
    code: 'COMMUTE_SERIES_OCCURRENCE_IN_PROGRESS',
    message: 'Cannot cancel an in-progress occurrence as a series',
  }),
  'HTTP 409 COMMUTE_SERIES_OCCURRENCE_IN_PROGRESS is recognized',
);
assertFalse(
  isCommuteSeriesOccurrenceInProgressError({
    status: 409,
    code: 'COMMUTE_SCHEDULE_CONFLICT',
  }),
  'other 409s are not treated as in-progress series cancel',
);

if (failed.length > 0) {
  throw new Error(`commuteSeries.utils tests failed:\n${failed.join('\n')}`);
}

console.log('commuteSeries.utils tests passed');
