/**
 * Assured passenger discovery contract — inspection tests (plain Node).
 * Backend owns visibility:
 *   ASSURANCE_PENDING → not in GET /rides/search?rideType=ASSURED
 *   ASSURANCE_ACTIVE + availableSeats > 0 → visible/bookable
 *   ASSURANCE_ACTIVE + availableSeats = 0 → not visible
 *   PUBLISHED is NOT the Assured passenger visibility gate
 * Mobile must not re-filter Assured search results by PUBLISHED.
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

const assertEqual = (actual, expected, label) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertIncludes = (haystack, needle, label) => {
  if (!String(haystack).includes(needle)) {
    failed.push(`${label}: missing ${JSON.stringify(needle)}`);
  }
};

const assertNotIncludes = (haystack, needle, label) => {
  if (String(haystack).includes(needle)) {
    failed.push(`${label}: should not contain ${JSON.stringify(needle)}`);
  }
};

const useRideResult = fs.readFileSync(
  path.join(root, 'features/ride-search/hooks/useRideResult.ts'),
  'utf8',
);
const rideSearchMapper = fs.readFileSync(
  path.join(root, 'features/ride-search/utils/rideSearch.mapper.ts'),
  'utf8',
);
const ridesSearchQuery = fs.readFileSync(
  path.join(root, 'features/ride-search/api/ridesSearch.query.ts'),
  'utf8',
);
const ridesSearchTypes = fs.readFileSync(
  path.join(root, 'features/ride-search/api/ridesSearch.types.ts'),
  'utf8',
);
const ridesSearchApi = fs.readFileSync(
  path.join(root, 'features/ride-search/api/ridesSearch.api.ts'),
  'utf8',
);
const assuredDepositUtils = fs.readFileSync(
  path.join(root, 'features/ride-search/utils/assuredDeposit.utils.ts'),
  'utf8',
);
const useRideDetails = fs.readFileSync(
  path.join(root, 'features/ride-search/hooks/useRideDetails.ts'),
  'utf8',
);
const useReviewBooking = fs.readFileSync(
  path.join(root, 'features/ride-search/hooks/useReviewBooking.ts'),
  'utf8',
);
const ridesPublicApi = fs.readFileSync(
  path.join(root, 'features/ride-search/api/ridesPublic.api.ts'),
  'utf8',
);

// ─── 1–2. Assured search calls GET /rides/search?rideType=ASSURED ───────────
assertIncludes(useRideResult, 'searchRides', 'useRideResult calls searchRides');
assertIncludes(useRideResult, 'mapRideTypeTabToApiRideType(filter)', 'tab maps to API rideType');
assertIncludes(assuredDepositUtils, "tab === 'assured' ? 'ASSURED'", 'assured tab → ASSURED');
assertIncludes(ridesSearchQuery, "params.set('rideType', query.rideType ?? 'REGULAR')", 'rideType query param');
assertIncludes(ridesSearchApi, 'buildSearchRidesPath(query)', 'search uses query builder');

const mapRideTypeTabToApiRideType = (tab) => (tab === 'assured' ? 'ASSURED' : 'REGULAR');
assertEqual(mapRideTypeTabToApiRideType('assured'), 'ASSURED', 'assured → ASSURED');
assertEqual(mapRideTypeTabToApiRideType('regular'), 'REGULAR', 'regular → REGULAR');

const buildSearchRidesPath = (query) => {
  const params = new URLSearchParams();
  params.set('source', query.source.trim());
  params.set('destination', query.destination.trim());
  params.set('date', query.date.trim());
  params.set('rideType', query.rideType ?? 'REGULAR');
  return `/rides/search?${params.toString()}`;
};

const assuredPath = buildSearchRidesPath({
  source: 'Noida',
  destination: 'Jaipur',
  date: '2026-08-28',
  rideType: 'ASSURED',
});
assertTrue(assuredPath.startsWith('/rides/search?'), 'Assured search hits /rides/search');
assertTrue(assuredPath.includes('rideType=ASSURED'), 'Assured search sends rideType=ASSURED');
assertFalse(assuredPath.includes('status='), 'search does not send status filter');
assertFalse(assuredPath.includes('PUBLISHED'), 'search does not require PUBLISHED');

const regularPath = buildSearchRidesPath({
  source: 'Noida',
  destination: 'Delhi',
  date: '2026-08-28',
  rideType: 'REGULAR',
});
assertTrue(regularPath.includes('rideType=REGULAR'), 'Regular search still REGULAR');

// ─── 3–5. No client-side Assured status filtering / PUBLISHED gate ───────────
assertNotIncludes(useRideResult, 'PUBLISHED', 'useRideResult has no PUBLISHED gate');
assertNotIncludes(useRideResult, 'ASSURANCE_ACTIVE', 'useRideResult does not hardcode ASSURANCE_ACTIVE');
assertNotIncludes(useRideResult, 'ASSURANCE_PENDING', 'useRideResult does not hardcode ASSURANCE_PENDING');
assertNotIncludes(useRideResult, 'MOCK_RIDE_RESULTS', 'useRideResult does not use MOCK_RIDE_RESULTS');
assertNotIncludes(useRideResult, 'getPublishedRidesForSearch', 'useRideResult does not use DemoData sheet');
assertFalse(
  /ride\.status|item\.status|row\.status|status === ['"]PUBLISHED/.test(useRideResult),
  'useRideResult has no ride-status client filter',
);
assertIncludes(useRideResult, 'mapRideSearchItemsToResults(response.items ?? [])', 'maps all backend items');

assertNotIncludes(rideSearchMapper, 'PUBLISHED', 'mapper has no PUBLISHED filter');
assertNotIncludes(rideSearchMapper, 'ASSURANCE_', 'mapper has no Assured status filter');
assertIncludes(rideSearchMapper, 'items.map(mapRideSearchItemToResult)', 'mapper maps all items 1:1');
assertIncludes(rideSearchMapper, 'availableSeats', 'mapper preserves availableSeats → seatsLeft');

// Search DTO intentionally omits status — visibility is backend-owned for GET /rides/search
assertNotIncludes(ridesSearchTypes, 'status:', 'RideSearchItemDto has no status field (backend filters)');
assertIncludes(ridesSearchTypes, 'availableSeats: number', 'DTO keeps availableSeats');
assertIncludes(ridesSearchTypes, "Client must not send driverId, status, or availableSeats", 'query docs: no status param');

// ─── 6. MOCK / DemoData not on production discovery path ───────────────────
assertNotIncludes(useRideResult, 'DemoData', 'no DemoData in useRideResult');
assertNotIncludes(useRideResult, 'ridesDemo', 'no ridesDemo in useRideResult');

// ─── 7–8. Public ride + details/review flow for Assured ────────────────────
assertIncludes(ridesPublicApi, 'ENDPOINTS.rides.publicById', 'GET /rides/public/:id client');
assertIncludes(useRideDetails, 'getPublicRideById', 'RideDetails fetches public ride for Assured');
assertIncludes(useRideDetails, 'computeAssuredDepositFromRide', 'RideDetails computes Assured deposit');
assertIncludes(useReviewBooking, 'getPublicRideById', 'ReviewBooking fetches public ride');
assertIncludes(useReviewBooking, 'computeAssuredDepositFromRide', 'ReviewBooking uses Assured deposit');

// ─── Contract simulation: what mobile does with backend search payloads ────
const mapApiRideType = (rideType) => (rideType === 'ASSURED' ? 'assured' : 'regular');
const mapRideSearchItemToResult = (item) => ({
  id: item.id,
  rideType: mapApiRideType(item.rideType),
  seatsLeft: Math.max(0, item.availableSeats),
  price: Number(item.pricePerSeat) || 0,
});
const mapRideSearchItemsToResults = (items) => items.map(mapRideSearchItemToResult);

/** Simulate backend visibility rules for Assured search responses. */
const backendAssuredSearchFilter = (rides) =>
  rides.filter(
    (r) =>
      r.rideType === 'ASSURED' &&
      r.status === 'ASSURANCE_ACTIVE' &&
      Number(r.availableSeats) > 0,
  );

const catalog = [
  {
    id: 'pending-1',
    rideType: 'ASSURED',
    status: 'ASSURANCE_PENDING',
    availableSeats: 3,
    pricePerSeat: '200',
  },
  {
    id: 'active-full',
    rideType: 'ASSURED',
    status: 'ASSURANCE_ACTIVE',
    availableSeats: 0,
    pricePerSeat: '200',
  },
  {
    id: 'e50c2975-193c-4706-ac0b-0544302bcda4',
    rideType: 'ASSURED',
    status: 'ASSURANCE_ACTIVE',
    availableSeats: 3,
    pricePerSeat: '2100',
    securityDepositAmount: '105',
  },
  {
    id: 'regular-1',
    rideType: 'REGULAR',
    status: 'PUBLISHED',
    availableSeats: 2,
    pricePerSeat: '500',
  },
];

const assuredBackendItems = backendAssuredSearchFilter(catalog);
assertEqual(assuredBackendItems.length, 1, 'backend returns only ASSURANCE_ACTIVE with seats');
assertEqual(assuredBackendItems[0].id, 'e50c2975-193c-4706-ac0b-0544302bcda4', 'visible Assured ride id');

const mobileResults = mapRideSearchItemsToResults(assuredBackendItems);
assertEqual(mobileResults.length, 1, 'mobile shows all backend Assured search items');
assertEqual(mobileResults[0].rideType, 'assured', 'ASSURED mapped to assured');
assertEqual(mobileResults[0].seatsLeft, 3, 'availableSeats preserved');
assertFalse(
  mobileResults.some((r) => r.id === 'pending-1'),
  'ASSURANCE_PENDING not presented (absent from backend list)',
);
assertFalse(
  mobileResults.some((r) => r.id === 'active-full'),
  'ASSURANCE_ACTIVE with 0 seats not presented',
);

// Mobile must NOT require PUBLISHED to show Assured results
const wronglyRequirePublished = (items) =>
  items.filter((i) => i.status === 'PUBLISHED');
assertEqual(
  wronglyRequirePublished(assuredBackendItems).length,
  0,
  'Assured ASSURANCE_ACTIVE would vanish under a PUBLISHED gate (regression guard)',
);
assertEqual(
  mapRideSearchItemsToResults(assuredBackendItems).length,
  1,
  'without PUBLISHED gate, Assured ASSURANCE_ACTIVE remains visible',
);

// Regular discovery unchanged: PUBLISHED Regular still maps
const regularItems = catalog.filter((r) => r.rideType === 'REGULAR' && r.status === 'PUBLISHED');
const regularMapped = mapRideSearchItemsToResults(regularItems);
assertEqual(regularMapped.length, 1, 'Regular PUBLISHED still maps');
assertEqual(regularMapped[0].rideType, 'regular', 'Regular type unchanged');

if (failed.length > 0) {
  console.error('FAILED:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('assuredPassengerDiscovery.test.js: all passed');
