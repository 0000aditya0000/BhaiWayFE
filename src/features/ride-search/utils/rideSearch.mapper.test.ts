import { ENDPOINTS } from '../../../network/endpoints';
import type { RideSearchItemDto } from '../api/ridesSearch.types';
import { buildSearchRidesPath } from '../api/ridesSearch.query';
import {
  formatApiDepartureTime,
  mapRideSearchItemToResult,
  mapSearchRidesError,
  parsePricePerSeat,
  resolveSearchDateParam,
  toCivilDateFromDate,
} from './rideSearch.mapper';

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

const sampleItem: RideSearchItemDto = {
  id: 'ride-abc',
  rideType: 'REGULAR',
  source: 'Noida Sector 18, Noida',
  destination: 'Connaught Place, Delhi',
  departureDate: '2026-08-21',
  departureTime: '09:00:00',
  availableSeats: 3,
  totalSeats: 4,
  pricePerSeat: '650',
  preferences: {
    maxTwoInBackSeat: true,
    noSmoking: true,
    noPets: true,
    luggageAllowed: true,
  },
  notes: 'Near metro gate 2',
  driver: {
    id: 'driver-1',
    displayName: 'Rahul Sharma',
    profilePhoto: 'https://cdn.example/rahul.jpg',
    rating: { averageRating: 4.5, totalRatings: 12 },
    recentRides: [
      {
        id: 'hist-1',
        date: '2026-08-15',
        source: 'Agra',
        destination: 'Mathura',
        status: 'COMPLETED',
      },
      {
        id: 'hist-2',
        date: '2026-08-10',
        source: 'Delhi',
        destination: 'Jaipur',
        status: 'CANCELLED',
      },
    ],
  },
  vehicle: {
    id: 'vehicle-1',
    vehicleType: 'CAR',
    make: 'Tata',
    model: 'Nexon',
    variant: 'XZ+',
    color: 'Black',
    seatingCapacity: 5,
  },
};

assertEqual(ENDPOINTS.rides.search, '/rides/search', 'search endpoint');

const civilDate = toCivilDateFromDate(new Date(2026, 7, 21, 15, 30, 0));
assertEqual(civilDate, '2026-08-21', 'civil date uses local calendar parts');

assertEqual(formatApiDepartureTime('09:00:00'), '9:00 AM', 'HH:mm:ss to display time');
assertEqual(formatApiDepartureTime('17:30'), '5:30 PM', 'HH:mm to display time');
assertEqual(parsePricePerSeat('650'), 650, 'price string preserved as number');
assertEqual(parsePricePerSeat('650.00'), 650, 'decimal price preserved');

const mapped = mapRideSearchItemToResult(sampleItem);
assertEqual(mapped.id, 'ride-abc', 'ride id');
assertEqual(mapped.rideType, 'regular', 'ride type lowercased');
assertEqual(mapped.driver.name, 'Rahul Sharma', 'driver display name');
assertEqual(mapped.driver.avatarUri, 'https://cdn.example/rahul.jpg', 'driver photo');
assertEqual(mapped.driver.rating, 4.5, 'driver averageRating');
assertEqual(mapped.driver.totalRatings, 12, 'driver totalRatings');
assertEqual(mapped.driver.recentRides.length, 2, 'recent rides mapped');
assertEqual(mapped.driver.recentRides[0]?.status, 'completed', 'newest recent ride status');
assertEqual(mapped.driver.recentRides[0]?.routeLabel, 'Agra → Mathura', 'recent ride route');
assertEqual(mapped.vehicle.color, 'Black', 'vehicle color');
assertEqual(mapped.vehicle.seatingCapacity, 5, 'vehicle seatingCapacity');
assertEqual(mapped.vehicle.vehicleType, 'CAR', 'vehicle type');
assertEqual(mapped.price, 650, 'mapped price');
assertEqual(mapped.seatsLeft, 3, 'available seats from response');
assertEqual(mapped.carModel, 'Tata Nexon XZ+', 'vehicle make + model + variant');
assertEqual(mapped.vehicle.label, 'Tata Nexon XZ+', 'vehicle label');
assertEqual(mapped.originCity, 'Noida Sector 18', 'short source');
assertEqual(mapped.destinationCity, 'Connaught Place', 'short destination');
assertEqual(mapped.departureTime, '9:00 AM', 'departure time label');
assertTrue(mapped.preferences.length >= 3, 'preferences mapped');

const emptyDriverMapped = mapRideSearchItemToResult({
  ...sampleItem,
  driver: {
    id: 'driver-2',
    displayName: 'New Driver',
    rating: { averageRating: 0, totalRatings: 0 },
    recentRides: [],
  },
});
assertEqual(emptyDriverMapped.driver.rating, 0, 'zero rating when none');
assertEqual(emptyDriverMapped.driver.recentRides.length, 0, 'empty recent rides when none');

const topLevelItem = {
  ...sampleItem,
  preferences: undefined,
  noSmoking: true,
  noPets: true,
  luggageAllowed: false,
  maxTwoInBackSeat: true,
} as RideSearchItemDto;
const topLevelMapped = mapRideSearchItemToResult(topLevelItem);
assertTrue(
  topLevelMapped.preferences.some((item) => item.id === 'no-smoking'),
  'top-level noSmoking maps to chip',
);
assertTrue(
  topLevelMapped.preferences.some((item) => item.id === 'max-two-back'),
  'top-level maxTwoInBackSeat maps to chip',
);
assertTrue(
  !topLevelMapped.preferences.some((item) => item.id === 'luggage'),
  'false luggage not shown',
);

const requestPath = buildSearchRidesPath({
  source: 'Noida',
  destination: 'Delhi',
  date: '2026-08-21',
  seats: 2,
  rideType: 'REGULAR',
  page: 1,
  limit: 20,
});
assertTrue(requestPath.includes('/rides/search?'), 'request path includes endpoint');
assertTrue(requestPath.includes('source=Noida'), 'source query param');
assertTrue(requestPath.includes('destination=Delhi'), 'destination query param');
assertTrue(requestPath.includes('date=2026-08-21'), 'date query param');
assertTrue(requestPath.includes('seats=2'), 'seats query param');
assertTrue(requestPath.includes('rideType=REGULAR'), 'rideType query param');
assertTrue(!requestPath.includes('driverId='), 'does not send driverId');
assertTrue(!requestPath.includes('availableSeats='), 'does not send availableSeats');
assertTrue(!requestPath.includes('pickupLatitude='), 'omits coords when not provided');

const requestPathWithCoords = buildSearchRidesPath({
  source: 'Noida',
  destination: 'Dehradun',
  date: '2026-08-21',
  seats: 1,
  rideType: 'REGULAR',
  pickupLatitude: 28.5355,
  pickupLongitude: 77.391,
  dropoffLatitude: 30.3165,
  dropoffLongitude: 78.0322,
});
assertTrue(requestPathWithCoords.includes('pickupLatitude=28.5355'), 'pickupLatitude sent');
assertTrue(requestPathWithCoords.includes('pickupLongitude=77.391'), 'pickupLongitude sent');
assertTrue(requestPathWithCoords.includes('dropoffLatitude=30.3165'), 'dropoffLatitude sent');
assertTrue(requestPathWithCoords.includes('dropoffLongitude=78.0322'), 'dropoffLongitude sent');
assertTrue(requestPathWithCoords.includes('source=Noida'), 'source name preserved with coords');
assertTrue(
  requestPathWithCoords.includes('destination=Dehradun'),
  'destination name preserved with coords',
);

const requestPathRejectsZero = buildSearchRidesPath({
  source: 'Noida',
  destination: 'Meerut',
  date: '2026-08-21',
  pickupLatitude: 0,
  pickupLongitude: 0,
  dropoffLatitude: 28.9845,
  dropoffLongitude: 77.7064,
});
assertTrue(!requestPathRejectsZero.includes('pickupLatitude='), 'rejects 0 pickup');
assertTrue(
  !requestPathRejectsZero.includes('dropoffLatitude='),
  'omits all coords when pickup invalid (all-or-none)',
);

const requestPathRejectsPartial = buildSearchRidesPath({
  source: 'Indirapuram',
  destination: 'Roorkee',
  date: '2026-08-26',
  pickupLatitude: 28.6415,
  pickupLongitude: 77.3655,
  // dropoff missing → send none
});
assertTrue(
  !requestPathRejectsPartial.includes('pickupLatitude='),
  'omits pickup when dropoff missing',
);
assertTrue(
  !requestPathRejectsPartial.includes('dropoffLatitude='),
  'omits dropoff when incomplete',
);

assertEqual(resolveSearchDateParam('2026-08-21'), '2026-08-21', 'valid ISO date');
assertEqual(resolveSearchDateParam('Tomorrow'), null, 'display label is not ISO date');

assertEqual(
  mapSearchRidesError({ status: 400, message: 'date must be a valid date' }),
  'date must be a valid date',
  '400 maps backend message',
);
assertEqual(
  mapSearchRidesError({ status: 401, message: 'Unauthorized' }),
  'Your session expired. Please sign in again.',
  '401 maps session message',
);

if (failed.length > 0) {
  throw new Error(`rideSearch.mapper tests failed:\n${failed.join('\n')}`);
}

console.log('rideSearch.mapper tests passed');
