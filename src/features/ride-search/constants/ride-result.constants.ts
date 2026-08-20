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

export const MOCK_RIDE_RESULTS: readonly RideResultItem[] = [
  {
    id: 'ride-1',
    rideType: 'regular',
    driver: {
      id: 'driver-1',
      name: 'Rahul Sharma',
      rating: 4.8,
      verified: true,
      yearsDriving: 6,
    },
    price: 1200,
    originalPrice: 1450,
    departureTime: '08:00 AM',
    carModel: 'Honda City',
    seatsLeft: 2,
    ac: true,
    luggage: 'Medium',
    originCity: 'Bengaluru',
    destinationCity: 'Mumbai',
    distanceKm: 845,
    durationMinutes: 720,
    durationLabel: '12 hr',
    preferences: [],
    features: [],
  },
  {
    id: 'ride-2',
    rideType: 'regular',
    driver: {
      id: 'driver-2',
      name: 'Priya Patel',
      rating: 4.9,
      verified: true,
      yearsDriving: 4,
    },
    price: 1350,
    departureTime: '09:30 AM',
    carModel: 'Toyota Innova',
    seatsLeft: 4,
    ac: true,
    luggage: 'Large',
    originCity: 'Bengaluru',
    destinationCity: 'Mumbai',
    distanceKm: 830,
    durationMinutes: 660,
    durationLabel: '11 hr',
    preferences: [],
    features: [],
  },
  {
    id: 'ride-3',
    rideType: 'regular',
    driver: {
      id: 'driver-3',
      name: 'Amit Kumar',
      rating: 4.5,
      verified: true,
      yearsDriving: 8,
    },
    price: 1100,
    departureTime: '11:00 AM',
    carModel: 'Maruti Swift',
    seatsLeft: 1,
    ac: true,
    luggage: 'Small',
    originCity: 'Bengaluru',
    destinationCity: 'Mumbai',
    distanceKm: 860,
    durationMinutes: 750,
    durationLabel: '12 hr 30 min',
    preferences: [],
    features: [],
  },
  {
    id: 'ride-4',
    rideType: 'assured',
    driver: {
      id: 'driver-4',
      name: 'Sneha Kapoor',
      rating: 5.0,
      verified: true,
      yearsDriving: 3,
    },
    price: 980,
    departureTime: '07:00 AM',
    carModel: 'Hyundai Creta',
    seatsLeft: 3,
    ac: true,
    luggage: 'Large',
    originCity: 'Bengaluru',
    destinationCity: 'Mumbai',
    distanceKm: 820,
    durationMinutes: 630,
    durationLabel: '10 hr 30 min',
    preferences: [],
    features: [],
  },
  {
    id: 'ride-5',
    rideType: 'assured',
    driver: {
      id: 'driver-5',
      name: 'Vikram Singh',
      rating: 4.7,
      verified: true,
      yearsDriving: 5,
    },
    price: 1050,
    departureTime: '06:15 AM',
    carModel: 'Kia Seltos',
    seatsLeft: 2,
    ac: true,
    luggage: 'Medium',
    originCity: 'Bengaluru',
    destinationCity: 'Mumbai',
    distanceKm: 835,
    durationMinutes: 645,
    durationLabel: '10 hr 45 min',
    preferences: [],
    features: [],
  },
  {
    id: 'ride-6',
    rideType: 'regular',
    driver: {
      id: 'driver-6',
      name: 'Neha Gupta',
      rating: 4.6,
      verified: true,
      yearsDriving: 2,
    },
    price: 1250,
    departureTime: '02:00 PM',
    carModel: 'Honda Amaze',
    seatsLeft: 3,
    ac: true,
    luggage: 'Medium',
    originCity: 'Bengaluru',
    destinationCity: 'Mumbai',
    distanceKm: 850,
    durationMinutes: 700,
    durationLabel: '11 hr 40 min',
    preferences: [],
    features: [],
  },
];

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
