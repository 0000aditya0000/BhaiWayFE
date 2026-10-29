import { ENDPOINTS } from '@/network/endpoints';
import { unwrapActiveRideItems } from '@/features/offer-ride/api/activeRides.unwrap';
import type { ActiveRideItemDto } from '@/features/offer-ride/api/rides.types';

import {
  ACTIVE_RIDE_COPY,
  ACTIVE_RIDE_LAYOUT,
  getActiveRideDockHeight,
} from '../constants/active-ride.constants';
import {
  activeRideTypeLabel,
  formatActiveRidePoints,
  mapActiveRideItem,
  parseActiveRidePoints,
  mapActiveRideItems,
  shouldShowActiveRideContainer,
} from './activeRide.mapper';
import { resolveActiveRideNavigation } from './activeRide.navigation';
import {
  INITIAL_ACTIVE_RIDES_STATE,
  isActiveRideContainerVisible,
  reduceActiveRidesFailure,
  reduceActiveRidesSelect,
  reduceActiveRidesSuccess,
  selectedActiveRide,
} from './activeRide.state';

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

const assertFalse = (value: boolean, label: string): void => {
  if (value) {
    failed.push(`${label}: expected false`);
  }
};

const passengerRide = (overrides: Partial<ActiveRideItemDto> = {}): ActiveRideItemDto => ({
  rideId: 'ride-passenger-1',
  bookingId: 'booking-1',
  role: 'PASSENGER',
  rideType: 'REGULAR',
  status: 'IN_PROGRESS',
  source: 'Saket, Delhi',
  destination: 'Cyber City, Gurugram',
  fare: '350',
  otp: '4821',
  ...overrides,
});

const driverRide = (overrides: Partial<ActiveRideItemDto> = {}): ActiveRideItemDto => ({
  rideId: 'ride-driver-1',
  role: 'DRIVER',
  rideType: 'ASSURED',
  status: 'IN_PROGRESS',
  source: 'Home',
  destination: 'Airport',
  totalPassengers: 2,
  totalFare: '900',
  otp: '9999',
  fare: '111',
  bookingId: 'should-not-surface',
  ...overrides,
});

assertEqual(ENDPOINTS.rides.myActive, '/rides/my-active', 'active rides endpoint path');

const emptyItems = unwrapActiveRideItems({ items: [] });
assertEqual(emptyItems.length, 0, 'empty items unwrap');
assertFalse(
  shouldShowActiveRideContainer(mapActiveRideItems(emptyItems)),
  'empty response hides the container',
);
assertFalse(
  isActiveRideContainerVisible(reduceActiveRidesSuccess(INITIAL_ACTIVE_RIDES_STATE, [])),
  'success with [] is not visible',
);

const passenger = mapActiveRideItem(passengerRide());
assertTrue(passenger != null, 'passenger item maps');
assertEqual(passenger?.source, 'Saket, Delhi', 'passenger source');
assertEqual(passenger?.destination, 'Cyber City, Gurugram', 'passenger destination');
assertEqual(passenger?.fareLabel, '350', 'passenger fare uses backend points');
assertEqual(passenger?.otp, '4821', 'permitted passenger OTP is shown');
assertEqual(passenger?.totalPassengers, null, 'passenger does not get driver passenger count');
assertEqual(passenger?.totalFareLabel, null, 'passenger does not get driver total fare');

const passengerNoOtp = mapActiveRideItem(passengerRide({ otp: null }));
assertEqual(passengerNoOtp?.otp, null, 'null OTP is omitted');
const passengerEmptyOtp = mapActiveRideItem(passengerRide({ otp: '  ' }));
assertEqual(passengerEmptyOtp?.otp, null, 'blank OTP is omitted');

const driver = mapActiveRideItem(driverRide());
assertTrue(driver != null, 'driver item maps');
assertEqual(driver?.source, 'Home', 'driver source');
assertEqual(driver?.destination, 'Airport', 'driver destination');
assertEqual(driver?.totalPassengers, 2, 'driver totalPassengers from backend');
assertEqual(driver?.totalPassengersLabel, '2 passengers', 'driver passenger count label');
assertEqual(driver?.totalFareLabel, '900', 'driver totalFare from backend');
assertEqual(driver?.otp, null, 'driver view never renders OTP');
assertEqual(driver?.bookingId, null, 'driver view never keeps passenger bookingId');
assertEqual(driver?.fareLabel, null, 'driver view never uses passenger fare');

assertEqual(
  activeRideTypeLabel('COMMUTE', 'RETURN'),
  'Commute · Return',
  'commute return is labelled correctly',
);
assertEqual(
  activeRideTypeLabel('COMMUTE', 'OUTBOUND'),
  'Commute · Outbound',
  'commute outbound is labelled correctly',
);
assertEqual(activeRideTypeLabel('COMMUTE', null), 'Commute', 'commute without direction stays Commute');
assertEqual(activeRideTypeLabel('REGULAR', 'RETURN'), 'Regular', 'regular is not labelled return');

const commuteReturn = mapActiveRideItem(
  driverRide({
    rideId: 'ride-return',
    rideType: 'COMMUTE',
    direction: 'RETURN',
    seriesId: 'series-1',
    occurrenceDate: '2026-10-29',
    totalPassengers: 1,
    totalFare: '80',
  }),
);
assertEqual(commuteReturn?.typeLabel, 'Commute · Return', 'mapped commute return label');
assertEqual(commuteReturn?.direction, 'RETURN', 'keeps RETURN direction');

const many = mapActiveRideItems([
  driverRide(),
  passengerRide(),
  passengerRide({ rideId: 'ride-passenger-2', bookingId: 'booking-2', otp: null, fare: '120' }),
]);
assertEqual(many.length, 3, 'maps all active rides');
let ui = reduceActiveRidesSuccess(INITIAL_ACTIVE_RIDES_STATE, many);
assertEqual(selectedActiveRide(ui)?.rideId, 'ride-driver-1', 'defaults to first ride');
ui = reduceActiveRidesSelect(ui, many[1]!.key);
assertEqual(selectedActiveRide(ui)?.rideId, 'ride-passenger-1', 'selects passenger ride independently');
assertEqual(selectedActiveRide(ui)?.otp, '4821', 'selected passenger keeps own OTP');
ui = reduceActiveRidesSelect(ui, many[2]!.key);
assertEqual(selectedActiveRide(ui)?.rideId, 'ride-passenger-2', 'selects second passenger independently');
assertEqual(selectedActiveRide(ui)?.otp, null, 'second passenger OTP is not mixed');
assertEqual(selectedActiveRide(ui)?.fareLabel, '120', 'second passenger fare is not mixed');

const passengerNav = resolveActiveRideNavigation(passenger!);
assertTrue(passengerNav.ok, 'passenger navigation ok');
if (passengerNav.ok) {
  assertEqual(passengerNav.role, 'PASSENGER', 'passenger nav role');
  assertEqual(passengerNav.pathname, '/ride-search/live-tracking', 'passenger live tracking screen');
  assertEqual(passengerNav.params.rideId, 'ride-passenger-1', 'passenger rideId');
  assertEqual(passengerNav.params.bookingId, 'booking-1', 'passenger bookingId');
}

const missingBooking = resolveActiveRideNavigation({
  ...passenger!,
  bookingId: null,
});
assertFalse(missingBooking.ok, 'passenger without bookingId does not navigate');

const driverPickupNav = resolveActiveRideNavigation(driver!, { driverPhase: 'PICKUP_PASSENGER' });
assertTrue(driverPickupNav.ok, 'driver pickup navigation ok');
if (driverPickupNav.ok) {
  assertEqual(driverPickupNav.role, 'DRIVER', 'driver nav role');
  assertEqual(driverPickupNav.pathname, '/my-rides/pickup', 'driver pickup screen');
  assertEqual(driverPickupNav.params.rideId, 'ride-driver-1', 'driver rideId');
  assertTrue(!('bookingId' in driverPickupNav.params), 'driver path has no bookingId');
  assertTrue(!('otp' in driverPickupNav.params), 'driver path has no otp');
}

const driverActiveNav = resolveActiveRideNavigation(driver!, { driverPhase: 'ACTIVE_TRIP' });
assertTrue(driverActiveNav.ok, 'driver active-trip navigation ok');
if (driverActiveNav.ok) {
  assertEqual(driverActiveNav.pathname, '/my-rides/active-trip', 'driver active trip screen');
  assertEqual(driverActiveNav.params.rideId, 'ride-driver-1', 'active trip uses selected rideId');
}

const commuteDriverNav = resolveActiveRideNavigation(commuteReturn!, {
  driverPhase: 'PICKUP_PASSENGER',
});
assertTrue(commuteDriverNav.ok, 'commute driver navigation ok');
if (commuteDriverNav.ok) {
  assertEqual(commuteDriverNav.params.rideType, 'commute', 'commute driver keeps commute kind');
  assertEqual(commuteDriverNav.params.rideId, 'ride-return', 'commute uses occurrence rideId');
}

let refreshed = reduceActiveRidesSuccess(ui, [many[0]!]);
assertEqual(refreshed.items.length, 1, 'refresh keeps only rides the backend still returns');
assertEqual(refreshed.selectedKey, many[0]!.key, 'refresh reselects a remaining ride');
assertTrue(!refreshed.items.some((item) => item.rideId === 'ride-passenger-1'), 'completed passenger ride is gone');

refreshed = reduceActiveRidesSuccess(refreshed, []);
assertFalse(isActiveRideContainerVisible(refreshed), 'empty backend list hides container after refresh');

const previous = reduceActiveRidesSuccess(INITIAL_ACTIVE_RIDES_STATE, [driver!]);
const afterFailure = reduceActiveRidesFailure(previous, 'network down');
assertEqual(afterFailure.items.length, 1, 'API failure keeps last known rides');
assertEqual(afterFailure.lastError, 'network down', 'API failure records error');
assertTrue(isActiveRideContainerVisible(afterFailure), 'stale rides stay visible after failure');

assertEqual(unwrapActiveRideItems(null), [], 'null payload does not throw');
assertEqual(unwrapActiveRideItems({}), [], 'object without items does not throw');
assertEqual(unwrapActiveRideItems('nope'), [], 'invalid payload does not throw');

assertTrue(
  ACTIVE_RIDE_LAYOUT.collapsedHeight < ACTIVE_RIDE_LAYOUT.expandedDetailsMaxHeight,
  'expanded details are taller than collapsed bar',
);
assertTrue(ACTIVE_RIDE_LAYOUT.bottomGap >= 12, 'card sits above the home safe-area gap');
assertTrue(ACTIVE_RIDE_LAYOUT.horizontalInset >= 16, 'card respects horizontal screen inset');
assertTrue(ACTIVE_RIDE_LAYOUT.zIndex >= 10, 'card stacks above home scroll content');
assertTrue(
  ACTIVE_RIDE_LAYOUT.collapsedHeight + ACTIVE_RIDE_LAYOUT.bottomGap < 140,
  'collapsed card stays compact above bottom navigation / home indicator',
);
assertEqual(
  getActiveRideDockHeight(),
  ACTIVE_RIDE_LAYOUT.collapsedHeight + ACTIVE_RIDE_LAYOUT.bottomGap,
  'home scroll reserves a dock equal to the collapsed pill',
);
assertTrue(ACTIVE_RIDE_LAYOUT.bottomGap >= 20, 'expanded sheet keeps space above the home footer');
assertEqual(ACTIVE_RIDE_COPY.goToRideLabel, 'Go To Ride', 'Go To Ride CTA copy');
assertEqual(ACTIVE_RIDE_COPY.closeLabel, 'Close', 'header close copy');

assertEqual(parseActiveRidePoints('1000'), 1000, 'integer points are not recalculated');
assertTrue(
  formatActiveRidePoints('1000')?.includes('1') === true,
  'point display keeps the backend integer value',
);
assertEqual(formatActiveRidePoints(0), '0', 'zero points from backend are shown as zero');

if (failed.length > 0) {
  console.error('activeRide tests failed:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('activeRide tests passed');
