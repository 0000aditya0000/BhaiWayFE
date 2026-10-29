import assert from 'node:assert/strict';

import type { RideSearchItemDto } from '@/features/ride-search/api/ridesSearch.types';

import { mapRideSearchItemToCommuteResult } from './mapCommuteRideSearch';
import { resolveCommuteRideEndpoints, resolveRouteMatchPercentFromApi } from './commuteBooking.utils';
import { getRouteMatchTier, matchesCommuteMatchFilter } from './routeMatchVisual';

const baseItem = {
  id: 'ride-1',
  rideType: 'COMMUTE',
  source: 'Cyber City, Gurugram',
  destination: 'Noida Sector 62',
  departureDate: '2026-08-31',
  departureTime: '18:45',
  availableSeats: 4,
  totalSeats: 4,
  pricePerSeat: '100',
  riderPricePerSeat: '110',
  preferences: {
    maxTwoInBackSeat: false,
    noSmoking: true,
    noPets: true,
    luggageAllowed: true,
  },
  driver: {
    id: 'driver-1',
    displayName: 'Test Driver',
  },
  vehicle: {
    id: 'vehicle-1',
    vehicleType: 'CAR',
    make: 'Honda',
    model: 'City',
    seatingCapacity: 4,
  },
} satisfies RideSearchItemDto;

assert.equal(resolveRouteMatchPercentFromApi({ routeMatchPercentage: 100 }), 100);
assert.equal(resolveRouteMatchPercentFromApi({ route_match_percentage: 92 }), 92);

const mapped = mapRideSearchItemToCommuteResult({
  ...baseItem,
  routeMatchPercentage: 100,
} as RideSearchItemDto);

assert.equal(mapped.matchPercent, 100, 'mapper maps routeMatchPercentage to matchPercent');

const endpoints = resolveCommuteRideEndpoints(
  {
    ...baseItem,
    sourceLatitude: 28.5,
    sourceLongitude: 77.1,
    destinationLatitude: 28.6,
    destinationLongitude: 77.2,
  },
  { originLat: 28.49, originLng: 77.09, destinationLat: 28.61, destinationLng: 77.21 },
);
assert.ok(endpoints, 'endpoints resolved');
assert.equal(endpoints!.pickup.latitude, 28.49, 'passenger pickup coords preferred');
assert.equal(endpoints!.dropoff.longitude, 77.21, 'passenger dropoff coords preferred');

assert.equal(getRouteMatchTier(80), 'high');
assert.equal(getRouteMatchTier(79), 'medium');
assert.equal(getRouteMatchTier(60), 'medium');
assert.equal(getRouteMatchTier(59), 'low');

assert.equal(matchesCommuteMatchFilter(85, 'high'), true);
assert.equal(matchesCommuteMatchFilter(55, 'high'), false);
assert.equal(matchesCommuteMatchFilter(null, 'all'), true);

console.log('mapCommuteRideSearch.test.ts passed');
