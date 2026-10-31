import type { WeekdayOption } from '../types';
import { formatBhaiWayCoins } from '@/shared/utils';

export const PUBLISH_COMMUTE_SCREEN = {
  title: 'Schedule Your Ride',
  subtitle: 'Plan your commute and share the journey.',
  routeLabel: 'Route Details',
  startLabel: 'Start Location',
  startPlaceholder: 'Select pickup point',
  officeLabel: 'Office Location',
  officePlaceholder: 'Select destination',
  departureDateLabel: 'Departure Date',
  departureDatePlaceholder: 'Select date',
  datePickerTitle: 'Select dates',
  datePickerSubtitle: 'You can select multiple dates in the next 7 days.',
  departureLabel: 'Departure Time',
  seatsLabel: 'Available Seats',
  recurringLabel: 'Schedule Recurring Ride',
  optionalBadge: 'Optional',
  recurringHint: 'Selected calendar dates also highlight the weekdays below.',
  returningLabel: 'Returning Back',
  returningHint:
    'Automatically schedule the return journey (Office to Home) for the same days.',
  returnTimeLabel: 'Return Departure',
  returnTimePlaceholder: '--:-- --',
  priceLabel: 'Price per seat (BhaiWay Coins)',
  pricePlaceholder: 'e.g. 150',
  recommendedBadge: 'Recommended',
  earningsPrefix: 'Estimated earnings for full ride:',
  nextLabel: 'Next',
  minSeats: 1,
  maxSeats: 6,
} as const;

export const WEEKDAY_OPTIONS: readonly WeekdayOption[] = [
  { id: 'mon', label: 'Mo' },
  { id: 'tue', label: 'Tu' },
  { id: 'wed', label: 'We' },
  { id: 'thu', label: 'Th' },
  { id: 'fri', label: 'Fr' },
  { id: 'sat', label: 'Sa' },
  { id: 'sun', label: 'Su' },
] as const;

export { DEFAULT_PUBLISH_COMMUTE_DRAFT } from './select-location.constants';

export const getPublishCommutePath = () => ({
  pathname: '/office-commute/publish' as const,
});

export const formatEstimatedEarnings = (pricePerSeat: string, seats: number): string => {
  const price = Number(pricePerSeat);
  if (!Number.isFinite(price) || price <= 0) {
    return formatBhaiWayCoins(0, { spaced: false });
  }
  return formatBhaiWayCoins(Math.round(price * seats), { spaced: false });
};

export const formatTimeLabel = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const parseTimeLabel = (value: string): Date => {
  const [hours = '9', minutes = '0'] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours) || 9, Number(minutes) || 0, 0, 0);
  return date;
};
