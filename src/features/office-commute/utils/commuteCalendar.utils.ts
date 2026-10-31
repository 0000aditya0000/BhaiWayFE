import { formatSlashDate, parseSlashDate, startOfDay } from '@/shared/utils/date';

import type { WeekdayId } from '../types';
import { weekdayIdFromDate } from './commuteSeries.utils';

/** Inclusive window: today through today + 6 (one week of publish dates). */
export const COMMUTE_PUBLISH_WINDOW_DAYS = 7;

export const addCalendarDays = (date: Date, days: number): Date =>
  startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));

export const commutePublishWindow = (
  from = new Date(),
): { minimumDate: Date; maximumDate: Date } => {
  const minimumDate = startOfDay(from);
  const maximumDate = addCalendarDays(minimumDate, COMMUTE_PUBLISH_WINDOW_DAYS - 1);
  return { minimumDate, maximumDate };
};

export const uniqueSortedOccurrenceDates = (dates: readonly Date[]): Date[] => {
  const byKey = new Map<string, Date>();
  for (const date of dates) {
    const next = startOfDay(date);
    byKey.set(`${next.getFullYear()}-${next.getMonth()}-${next.getDate()}`, next);
  }
  return [...byKey.values()].sort((a, b) => a.getTime() - b.getTime());
};

export const isDateInInclusiveWindow = (date: Date, min: Date, max: Date): boolean => {
  const ms = startOfDay(date).getTime();
  return ms >= startOfDay(min).getTime() && ms <= startOfDay(max).getTime();
};

export const clampDatesToWindow = (
  dates: readonly Date[],
  min: Date,
  max: Date,
): Date[] => uniqueSortedOccurrenceDates(dates).filter((date) => isDateInInclusiveWindow(date, min, max));

export const weekdaysFromDates = (dates: readonly Date[]): WeekdayId[] => {
  const seen = new Set<WeekdayId>();
  const order: WeekdayId[] = [];
  for (const date of uniqueSortedOccurrenceDates(dates)) {
    const id = weekdayIdFromDate(date);
    if (id && !seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  }
  return order;
};

export const datesInWindowForWeekdays = (
  weekdays: readonly WeekdayId[],
  min: Date,
  max: Date,
): Date[] => {
  if (weekdays.length === 0) {
    return [];
  }
  const wanted = new Set(weekdays);
  const dates: Date[] = [];
  const cursor = startOfDay(min);
  const end = startOfDay(max).getTime();
  while (cursor.getTime() <= end) {
    const id = weekdayIdFromDate(cursor);
    if (id && wanted.has(id)) {
      dates.push(startOfDay(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

export const occurrenceDatesFromDraft = (
  departureDate: string,
  recurringDays: readonly WeekdayId[],
  min: Date,
  max: Date,
): Date[] => {
  if (recurringDays.length > 0) {
    return datesInWindowForWeekdays(recurringDays, min, max);
  }
  const parsed = parseSlashDate(departureDate);
  if (parsed && isDateInInclusiveWindow(parsed, min, max)) {
    return [startOfDay(parsed)];
  }
  return [];
};

export const formatOccurrenceDateField = (
  dates: readonly Date[],
  fallback = '',
): string => {
  const sorted = uniqueSortedOccurrenceDates(dates);
  if (sorted.length === 0) {
    return fallback;
  }
  const first = formatSlashDate(sorted[0]!);
  if (sorted.length === 1) {
    return first;
  }
  return `${first} · ${sorted.length} days`;
};
