const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;

export const CALENDAR_WEEKDAY_LABELS = WEEKDAY_LABELS;

export const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export const addMonths = (date: Date, delta: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

export const isSameCalendarDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfDayMs = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const isDayDisabled = (
  date: Date,
  minimumDate?: Date,
  maximumDate?: Date,
): boolean => {
  const ms = startOfDayMs(date);
  if (minimumDate && ms < startOfDayMs(minimumDate)) {
    return true;
  }
  if (maximumDate && ms > startOfDayMs(maximumDate)) {
    return true;
  }
  return false;
};

export interface CalendarCell {
  date: Date;
  inMonth: boolean;
}

/** Monday-first month grid, padded to full weeks. */
export const buildMonthCells = (month: Date): CalendarCell[] => {
  const first = startOfMonth(month);
  const mondayIndex = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < mondayIndex; i += 1) {
    const date = new Date(first);
    date.setDate(first.getDate() - (mondayIndex - i));
    cells.push({ date, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(month.getFullYear(), month.getMonth(), day),
      inMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!.date;
    const date = new Date(last);
    date.setDate(last.getDate() + 1);
    cells.push({ date, inMonth: false });
  }

  return cells;
};

export const formatMonthTitle = (date: Date): string =>
  date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

export const to12HourParts = (
  date: Date,
): { hour: number; minute: number; period: 'AM' | 'PM' } => {
  const hours24 = date.getHours();
  const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM';
  const hour = hours24 % 12 || 12;
  return { hour, minute: date.getMinutes(), period };
};

export const apply12HourParts = (
  base: Date,
  hour: number,
  minute: number,
  period: 'AM' | 'PM',
): Date => {
  const next = new Date(base);
  const hour12 = Math.min(12, Math.max(1, hour));
  let hours24 = hour12 % 12;
  if (period === 'PM') {
    hours24 += 12;
  }
  next.setHours(hours24, Math.min(59, Math.max(0, minute)), 0, 0);
  return next;
};

export const formatTimePreview = (hour: number, minute: number, period: 'AM' | 'PM'): string =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;

/** Arrow taps add whole minutes to the clock, wrapping hour and AM/PM. */
export const addMinutesTo12HourParts = (
  hour: number,
  minute: number,
  period: 'AM' | 'PM',
  deltaMinutes: number,
): { hour: number; minute: number; period: 'AM' | 'PM' } => {
  const next = apply12HourParts(new Date(2000, 0, 1), hour, minute, period);
  next.setMinutes(next.getMinutes() + deltaMinutes);
  return to12HourParts(next);
};
