import {
  clampDatesToWindow,
  commutePublishWindow,
  datesInWindowForWeekdays,
  formatOccurrenceDateField,
  occurrenceDatesFromDraft,
  weekdaysFromDates,
} from './commuteCalendar.utils';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const civil = (year: number, month: number, day: number): Date =>
  new Date(year, month - 1, day);

/** Thursday 29 Oct 2026 → window Thu 29 Oct … Wed 4 Nov. */
const today = civil(2026, 10, 29);
const { minimumDate, maximumDate } = commutePublishWindow(today);

assertEqual(minimumDate.getDate(), 29, 'window starts today');
assertEqual(maximumDate.getFullYear(), 2026, 'window year');
assertEqual(maximumDate.getMonth(), 10, 'window ends in November');
assertEqual(maximumDate.getDate(), 4, 'window is today through +6 days');

const thu = civil(2026, 10, 29);
const sat = civil(2026, 10, 31);
const mon = civil(2026, 11, 2);
const wed = civil(2026, 11, 4);
const tooLate = civil(2026, 11, 5);

assertEqual(weekdaysFromDates([wed, thu, mon]), ['thu', 'mon', 'wed'], 'weekdays follow date order');
assertEqual(
  clampDatesToWindow([tooLate, thu, sat, thu], minimumDate, maximumDate).map((d) => d.getDate()),
  [29, 31],
  'clamps to the 7-day window and de-dupes',
);

assertEqual(
  datesInWindowForWeekdays(['mon', 'thu'], minimumDate, maximumDate).map((d) => d.getDate()),
  [29, 2],
  'weekday chips map to the matching dates in the window',
);

assertEqual(
  occurrenceDatesFromDraft('29/10/2026', ['thu', 'sat', 'mon'], minimumDate, maximumDate).map(
    (d) => d.getDate(),
  ),
  [29, 31, 2],
  'recurring days reconstruct calendar selection',
);

assertEqual(
  occurrenceDatesFromDraft('31/10/2026', [], minimumDate, maximumDate).map((d) => d.getDate()),
  [31],
  'one-time draft still seeds the calendar with the departure date',
);

assertEqual(formatOccurrenceDateField([thu], ''), '29/10/2026', 'single date field');
assertEqual(
  formatOccurrenceDateField([mon, thu, sat], ''),
  '29/10/2026 · 3 days',
  'multi date field shows earliest plus count',
);
assertEqual(formatOccurrenceDateField([], 'dd/mm/yyyy'), 'dd/mm/yyyy', 'empty date field fallback');

if (failed.length > 0) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('commuteCalendar.utils tests passed');
