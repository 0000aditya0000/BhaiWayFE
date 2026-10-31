import {
  addMinutesTo12HourParts,
  apply12HourParts,
  buildMonthCells,
  isDateInSelection,
  isDayDisabled,
  isSameCalendarDay,
  to12HourParts,
  toggleSelectedDay,
  uniqueSortedDays,
} from './calendar';

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

const oct2026 = new Date(2026, 9, 1);
const cells = buildMonthCells(oct2026);
assertEqual(cells.length % 7, 0, 'grid is full weeks');
assertTrue(cells[0]!.date.getDay() === 1, 'grid starts on Monday');
assertTrue(
  cells.some((cell) => cell.inMonth && cell.date.getDate() === 30),
  'includes 30 Oct',
);

const min = new Date(2026, 9, 29);
assertTrue(isDayDisabled(new Date(2026, 9, 28), min), 'day before min is disabled');
assertTrue(!isDayDisabled(new Date(2026, 9, 30), min), 'day on/after min is enabled');

const noon = new Date(2026, 9, 30, 14, 5, 0);
assertEqual(to12HourParts(noon), { hour: 2, minute: 5, period: 'PM' }, '14:05 → 2:05 PM');
const applied = apply12HourParts(noon, 9, 0, 'AM');
assertTrue(applied.getHours() === 9 && applied.getMinutes() === 0, '9:00 AM applied');
assertTrue(isSameCalendarDay(applied, noon), 'time apply keeps the calendar day');

assertEqual(
  addMinutesTo12HourParts(10, 50, 'AM', 15),
  { hour: 11, minute: 5, period: 'AM' },
  'minute arrow +15 carries into the next hour',
);
assertEqual(
  addMinutesTo12HourParts(11, 50, 'AM', 15),
  { hour: 12, minute: 5, period: 'PM' },
  'minute arrow +15 carries AM into PM',
);
assertEqual(
  addMinutesTo12HourParts(12, 7, 'PM', -15),
  { hour: 11, minute: 52, period: 'AM' },
  'minute arrow -15 borrows from the previous hour',
);

const thu = new Date(2026, 9, 29);
const fri = new Date(2026, 9, 30);
const sat = new Date(2026, 9, 31);
const windowMin = thu;
const windowMax = new Date(2026, 10, 4);
assertEqual(
  uniqueSortedDays([sat, thu, fri, thu]).map((d) => d.getDate()),
  [29, 30, 31],
  'uniqueSortedDays de-dupes and sorts',
);
assertTrue(isDateInSelection([thu, sat], fri) === false, 'unselected day is not in selection');
assertEqual(
  toggleSelectedDay([thu], fri, windowMin, windowMax).map((d) => d.getDate()),
  [29, 30],
  'multi-select adds another day in the window',
);
assertEqual(
  toggleSelectedDay([thu, fri], fri, windowMin, windowMax).map((d) => d.getDate()),
  [29],
  'multi-select removes a tapped selected day',
);
assertEqual(
  toggleSelectedDay([thu], thu, windowMin, windowMax).map((d) => d.getDate()),
  [29],
  'last remaining date cannot be cleared',
);
assertEqual(
  toggleSelectedDay([thu], new Date(2026, 10, 5), windowMin, windowMax).map((d) => d.getDate()),
  [29],
  'days past the 7-day window stay disabled',
);

if (failed.length > 0) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('NativeDatePicker calendar tests passed');
