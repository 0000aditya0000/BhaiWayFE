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
assertEqual(mapped.price, 650, 'mapped price');
assertEqual(mapped.seatsLeft, 3, 'available seats from response');
assertEqual(mapped.carModel, 'Tata Nexon', 'vehicle make + model without color');
assertEqual(mapped.originCity, 'Noida Sector 18', 'short source');
assertEqual(mapped.destinationCity, 'Connaught Place', 'short destination');
assertEqual(mapped.departureTime, '9:00 AM', 'departure time label');
assertTrue(mapped.preferences.length >= 3, 'preferences mapped');

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
