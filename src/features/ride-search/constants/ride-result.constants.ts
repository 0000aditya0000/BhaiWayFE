import type {
  RideResultFilterOption,
  RideResultItem,
  RideResultSortOption,
} from '../types';
import { formatBhaiWayCoins } from '@/shared/utils';

export const RIDE_RESULT_SCREEN = {
  title: 'Available Rides',
  emptyTitle: 'No Rides Available',
  emptySubtitle: 'Try changing the date or filters to find matching rides.',
  modifySearchLabel: 'Modify Search',
  refreshLabel: 'Refresh',
  bookLabel: 'Book Ride',
  sortLabel: 'Sort',
} as const;

export const RIDE_RESULT_FILTERS: readonly RideResultFilterOption[] = [
  { id: 'regular', label: 'Regular' },
  { id: 'assured', label: 'Assured' },
] as const;

export const RIDE_RESULT_SORT_OPTIONS: readonly RideResultSortOption[] = [
  { id: 'price-asc', label: 'Price ↑' },
  { id: 'price-desc', label: 'Price ↓' },
  { id: 'departure', label: 'Earliest' },
  { id: 'rating', label: 'Rating' },
  { id: 'duration', label: 'Fastest' },
] as const;

/** Parse "08:00 AM" style labels into minutes from midnight for sorting. */
export const departureTimeToMinutes = (label: string): number => {
  const match = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return 0;
  }
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridian = match[3].toUpperCase();
  if (meridian === 'PM' && hours < 12) {
    hours += 12;
  }
  if (meridian === 'AM' && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
};

/** Legacy demo list — unused by live GET /rides/search. Kept typed for compile. */
export const MOCK_RIDE_RESULTS: readonly RideResultItem[] = [];

export const getSeatUrgency = (seatsLeft: number): 'available' | 'limited' | 'last' => {
  if (seatsLeft <= 1) {
    return 'last';
  }
  if (seatsLeft <= 2) {
    return 'limited';
  }
  return 'available';
};

export const formatRidePrice = (value: number): string =>
  formatBhaiWayCoins(value, { spaced: false });

export const getRideResultPath = (params: {
  origin: string;
  destination: string;
  date: string;
  dateLabel: string;
  passengers: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}) => ({
  pathname: '/ride-search/result' as const,
  params: {
    origin: params.origin,
    destination: params.destination,
    date: params.date,
    dateLabel: params.dateLabel,
    passengers: String(params.passengers),
    originLat: params.originLat != null ? String(params.originLat) : '',
    originLng: params.originLng != null ? String(params.originLng) : '',
    destinationLat: params.destinationLat != null ? String(params.destinationLat) : '',
    destinationLng: params.destinationLng != null ? String(params.destinationLng) : '',
  },
});
