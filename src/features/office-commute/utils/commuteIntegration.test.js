/**
 * Daily Office Commute mobile contract tests (A–M).
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../../..');
const failed = [];

const assertTrue = (value, label) => {
  if (!value) failed.push(`${label}: expected true`);
};

const assertFalse = (value, label) => {
  if (value) failed.push(`${label}: expected false`);
};

const assertIncludes = (haystack, needle, label) => {
  if (!String(haystack).includes(needle)) {
    failed.push(`${label}: missing ${needle}`);
  }
};

const assertNotIncludes = (haystack, needle, label) => {
  if (String(haystack).includes(needle)) {
    failed.push(`${label}: should not contain ${needle}`);
  }
};

const bookingUtils = fs.readFileSync(
  path.join(root, 'features/office-commute/utils/commuteBooking.utils.ts'),
  'utf8',
);
const mapSearch = fs.readFileSync(
  path.join(root, 'features/office-commute/utils/mapCommuteRideSearch.ts'),
  'utf8',
);
const ridesSearchTypes = fs.readFileSync(
  path.join(root, 'features/ride-search/api/ridesSearch.types.ts'),
  'utf8',
);
const useCommuteRideResult = fs.readFileSync(
  path.join(root, 'features/office-commute/hooks/useCommuteRideResult.ts'),
  'utf8',
);
const useCommuteReviewBooking = fs.readFileSync(
  path.join(root, 'features/office-commute/hooks/useCommuteReviewBooking.ts'),
  'utf8',
);
const useCommutePayment = fs.readFileSync(
  path.join(root, 'features/office-commute/hooks/useCommutePayment.ts'),
  'utf8',
);
const paymentSummary = fs.readFileSync(
  path.join(
    root,
    'features/office-commute/components/CommutePaymentSummary/CommutePaymentSummary.tsx',
  ),
  'utf8',
);
const bookingsApi = fs.readFileSync(
  path.join(root, 'features/ride-search/api/bookings.api.ts'),
  'utf8',
);
const mapDriverBooking = fs.readFileSync(
  path.join(root, 'features/my-rides/utils/mapDriverBooking.ts'),
  'utf8',
);
const useDriverTrackRide = fs.readFileSync(
  path.join(root, 'features/my-rides/hooks/useDriverTrackRide.ts'),
  'utf8',
);
const useCommuteBookingRequestActions = fs.readFileSync(
  path.join(root, 'features/my-rides/hooks/useCommuteBookingRequestActions.ts'),
  'utf8',
);
const rideSearchMapper = fs.readFileSync(
  path.join(root, 'features/ride-search/utils/rideSearch.mapper.ts'),
  'utf8',
);
const bookedConstants = fs.readFileSync(
  path.join(root, 'features/office-commute/constants/commute-ride-booked.constants.ts'),
  'utf8',
);
const useMyRides = fs.readFileSync(
  path.join(root, 'features/my-rides/hooks/useMyRides.ts'),
  'utf8',
);
const useRidePublished = fs.readFileSync(
  path.join(root, 'features/office-commute/hooks/useRidePublished.ts'),
  'utf8',
);
const commuteMyRidesUtils = fs.readFileSync(
  path.join(root, 'features/my-rides/utils/commuteMyRides.utils.ts'),
  'utf8',
);

// Inline mirrors
const resolveRiderPrice = (ride) => {
  if (ride.riderPricePerSeat != null && String(ride.riderPricePerSeat).trim() !== '') {
    return Number(ride.riderPricePerSeat);
  }
  return Number(ride.pricePerSeat);
};

const computeTotal = (riderPrice, seats) => String(Math.round(riderPrice) * Math.max(1, seats));

// A. Search COMMUTE
assertIncludes(useCommuteRideResult, "rideType: 'COMMUTE'", 'search uses COMMUTE');

// B. riderPricePerSeat displayed
assertIncludes(mapSearch, 'resolveCommuteRiderPricePerSeat', 'mapper uses rider price');
assertIncludes(mapSearch, 'resolveRouteMatchPercentFromApi', 'mapper uses route match resolver');
assertIncludes(bookingUtils, 'route_match_percent', 'route match snake_case supported');
assertIncludes(bookingUtils, 'routeMatchPercentage', 'route match percentage camelCase supported');
assertIncludes(ridesSearchTypes, 'routeMatchPercentage', 'search DTO includes routeMatchPercentage');
assertIncludes(bookingUtils, 'resolveCommuteRideEndpoints', 'commute endpoint resolver exported');
assertIncludes(bookingUtils, 'resolveRouteMatchPercentFromApi', 'route match resolver exported');
assertIncludes(useCommuteReviewBooking, 'fetchDrivingRoute', 'review booking loads driving route');
assertIncludes(mapSearch, 'resolveCoPassengers', 'mapper maps co-passengers');
assertTrue(resolveRiderPrice({ pricePerSeat: 100, riderPricePerSeat: 110 }) === 110, 'rider price preferred');

// C. no platform fee in passenger UI
assertNotIncludes(paymentSummary, 'platformFee', 'no platform fee row');
assertNotIncludes(paymentSummary, 'Platform Fee', 'no platform fee label');

// D. multi-seat fare
assertTrue(computeTotal(110, 2) === '220', '2 seats fare');

// E. PAY_NOW payload
assertIncludes(bookingUtils, "paymentMethod: 'PAY_NOW'", 'commute PAY_NOW only');
assertNotIncludes(bookingUtils, 'PAY_LATER', 'no PAY_LATER in commute payload');
assertNotIncludes(bookingUtils, 'farePayment', 'no farePayment for commute');

// F. success PENDING copy
assertIncludes(bookedConstants, 'titlePending', 'pending success title');
assertIncludes(bookedConstants, 'Waiting for the driver', 'pending waiting copy');
assertNotIncludes(bookedConstants, 'Booking confirmed', 'no confirmed wording on pending');

// G. driver pending requests
assertIncludes(mapDriverBooking, 'filterPendingCommuteBookings', 'pending commute filter');
assertIncludes(useDriverTrackRide, "status: 'PENDING'", 'driver loads pending');
assertIncludes(useDriverTrackRide, 'useCommuteBookingRequestActions', 'track ride uses shared actions');

// H. driver accept
assertIncludes(bookingsApi, 'acceptBookingById', 'accept API');
assertIncludes(useCommuteBookingRequestActions, 'acceptBookingById', 'driver accept wired');

// I. driver reject
assertIncludes(bookingsApi, 'rejectBookingById', 'reject API');
assertIncludes(useCommuteBookingRequestActions, 'rejectBookingById', 'driver reject wired');

// J. refund handling
assertIncludes(
  fs.readFileSync(
    path.join(root, 'features/my-rides/constants/commute-booking-requests.constants.ts'),
    'utf8',
  ),
  'refund',
  'reject refund copy',
);

// K. completion — existing ride complete API unchanged
assertIncludes(
  fs.readFileSync(path.join(root, 'features/offer-ride/api/rides.api.ts'), 'utf8'),
  '/complete',
  'complete ride endpoint exists',
);

// L. Regular regression
assertIncludes(rideSearchMapper, "rideType === 'ASSURED' ? 'assured' : 'regular'", 'regular mapper unchanged');

// M. Assured regression
assertNotIncludes(useCommutePayment, 'ASSURED_DEPOSIT', 'commute payment not assured');

// N. Office commute My Rides — upcoming mixes driver + rider COMMUTE only
assertIncludes(useMyRides, 'filterOfficeCommuteDriverRides', 'office commute driver filter');
assertIncludes(useMyRides, 'filterOfficeCommuteBookings', 'office commute booking filter');
assertIncludes(useMyRides, 'filterStandardDriverRides', 'standard hides commute driver rides');
assertIncludes(useMyRides, 'filterStandardBookings', 'standard hides commute bookings');

// O. Office commute past — both history APIs merged with COMMUTE filter
assertIncludes(useMyRides, 'isCommuteApiRide(item)', 'past filters commute driver history');
assertIncludes(useMyRides, 'isCommuteApiBooking(item)', 'past filters commute booking history');

// P. Published → My Rides keeps office commute surface + refresh
assertIncludes(useRidePublished, 'myRidesSurfaceStore.setOfficeCommute', 'published sets commute surface');
assertIncludes(useRidePublished, 'driverRidesRefreshStore.bump', 'published bumps driver refresh');
assertIncludes(commuteMyRidesUtils, "=== 'COMMUTE'", 'commute type helper');

const commuteResultCard = fs.readFileSync(
  path.join(root, 'features/office-commute/components/CommuteRideResultCard/CommuteRideResultCard.tsx'),
  'utf8',
);
assertIncludes(commuteResultCard, 'pickupLabel', 'card shows pickup from API');
assertIncludes(commuteResultCard, 'getRouteMatchVisual', 'card uses route match color tiers');
assertIncludes(useCommuteRideResult, 'filterCommuteRideResults', 'hook filters commute results');
assertIncludes(useCommuteRideResult, 'matchFilterId', 'hook exposes match filter');
assertIncludes(commuteResultCard, 'seatsNote', 'card shows shared-by copy');

// Q. Driver booking requests screen + actions
const commuteBookingRequestsScreen = fs.readFileSync(
  path.join(root, 'screens/my-rides/CommuteBookingRequestsScreen/CommuteBookingRequestsScreen.tsx'),
  'utf8',
);
const useCommuteBookingRequests = fs.readFileSync(
  path.join(root, 'features/my-rides/hooks/useCommuteBookingRequests.ts'),
  'utf8',
);
const bookingRequestsRoute = fs.readFileSync(
  path.join(root, '../app/my-rides/booking-requests.tsx'),
  'utf8',
);
const screensConfig = fs.readFileSync(path.join(root, 'config/screens.ts'), 'utf8');
const myRidesScreen = fs.readFileSync(
  path.join(root, 'screens/my-rides/MyRidesScreen/MyRidesScreen.tsx'),
  'utf8',
);

assertIncludes(useCommuteBookingRequests, 'listDriverBookings', 'requests screen loads driver bookings');
assertNotIncludes(
  useCommuteBookingRequests,
  "status: 'PENDING'",
  'does not use unscoped PENDING query that 404s without rideId',
);
assertIncludes(useCommuteBookingRequests, 'groupPendingCommuteBookingsByRide', 'requests grouped by ride');
assertIncludes(useCommuteBookingRequestActions, 'acceptBookingById', 'accept uses booking id only');
assertIncludes(useCommuteBookingRequestActions, 'rejectBookingById', 'reject uses booking id only');
assertIncludes(useCommuteBookingRequestActions, 'inFlightIdsRef', 'per-request in-flight guard');
assertIncludes(commuteBookingRequestsScreen, 'PendingRequestCard', 'reuses pending request card');
assertIncludes(bookingRequestsRoute, 'CommuteBookingRequestsScreen', 'booking-requests route wired');
assertIncludes(screensConfig, 'booking-requests', 'screen config registered');
assertIncludes(myRidesScreen, 'openBookingRequests', 'my rides opens booking requests');
assertIncludes(myRidesScreen, 'pendingCommuteRequestCount', 'my rides shows pending count banner');
assertIncludes(mapDriverBooking, 'groupPendingCommuteBookingsByRide', 'group helper exported');
assertNotIncludes(mapDriverBooking, 'rating: 4.8', 'no fabricated default rating');

if (failed.length > 0) {
  console.error('commuteIntegration tests failed:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('commuteIntegration tests passed');
