import type {
  CommuteMatchFilterOption,
  CommuteRideResultItem,
  CommuteResultSortOption,
} from '../types/commute-ride-result.types';

export const COMMUTE_RIDE_RESULT_SCREEN = {
  title: 'Available Rides',
  subtitle: 'Matched rides for your search.',
  filtersTitle: 'Filter & sort',
  editLabel: 'Edit',
  bookLabel: 'Request to Join',
  requestingLabel: 'Requesting...',
  requestedLabel: 'Requested',
  requestSuccessToast: 'Ride request sent successfully!',
  verifiedBadge: 'Verified Corporate ID',
  unverifiedBadge: 'Un-verified',
  priceCaption: 'per seat',
  departureLabel: 'Departure',
  routeMatchLabel: (percent: number) => `Route match ${percent}%`,
  sharedByOthers: (count: number) =>
    count === 1 ? 'Shared by 1 other' : `Shared by ${count} others`,
  directRide: 'Direct ride',
  seatsAvailable: (count: number) =>
    count === 1 ? '1 seat available' : `${count} seats available`,
  sameOrganizationBadge: 'Same Organization',
  emptyTitle: 'No commute rides found',
  emptySubtitle: 'Try a different time or route to find colleagues heading your way.',
  emptyFilteredTitle: 'No rides match this filter',
  emptyFilteredSubtitle: 'Try another route match range or reset filters to see all results.',
} as const;

export const COMMUTE_MATCH_FILTERS: readonly CommuteMatchFilterOption[] = [
  { id: 'all', label: 'All rides' },
  { id: 'high', label: '≥80%', hint: 'Best match' },
  { id: 'medium', label: '60–79%', hint: 'Good match' },
  { id: 'low', label: '<60%', hint: 'Lower match' },
] as const;

export const COMMUTE_RESULT_SORT_OPTIONS: readonly CommuteResultSortOption[] = [
  { id: 'match-desc', label: 'Best match' },
  { id: 'price-asc', label: 'Price ↑' },
  { id: 'departure', label: 'Earliest' },
] as const;

/** Legacy demo list — unused by live GET /rides/search. Kept typed for compile. */
export const MOCK_COMMUTE_RIDE_RESULTS: readonly CommuteRideResultItem[] = [];

export const getCommuteRideResultPath = (params: {
  origin: string;
  destination: string;
  dateLabel: string;
  timeLabel: string;
  sameOrganizationOnly?: boolean;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}) => ({
  pathname: '/office-commute/result' as const,
  params: {
    origin: params.origin,
    destination: params.destination,
    dateLabel: params.dateLabel,
    timeLabel: params.timeLabel,
    sameOrganizationOnly: params.sameOrganizationOnly ? 'true' : 'false',
    originLat: params.originLat != null ? String(params.originLat) : '',
    originLng: params.originLng != null ? String(params.originLng) : '',
    destinationLat: params.destinationLat != null ? String(params.destinationLat) : '',
    destinationLng: params.destinationLng != null ? String(params.destinationLng) : '',
  },
});
