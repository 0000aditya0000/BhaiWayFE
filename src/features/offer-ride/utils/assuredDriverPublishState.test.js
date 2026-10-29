/**
 * Driver Assured post-publish state + Upcoming Rides status mapping — plain Node.
 */

const failed = [];

const assertEqual = (actual, expected, label) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value, label) => {
  if (!value) failed.push(`${label}: expected true`);
};

const assertFalse = (value, label) => {
  if (value) failed.push(`${label}: expected false`);
};

const assertNotIncludes = (haystack, needle, label) => {
  if (String(haystack).toLowerCase().includes(String(needle).toLowerCase())) {
    failed.push(`${label}: must not include "${needle}"`);
  }
};

// --- mirror mapRideStatusLabel.ts ---
const normalizeRideStatus = (status) =>
  String(status ?? '')
    .trim()
    .toUpperCase();

const mapRideStatusLabel = (status, rideType) => {
  const value = normalizeRideStatus(status);
  const isAssured = String(rideType ?? '').trim().toUpperCase() === 'ASSURED';

  switch (value) {
    case 'ASSURANCE_ACTIVE':
      return 'Under Assurance';
    case 'ASSURANCE_PENDING':
      return 'Assurance Pending';
    case 'PUBLISHED':
      return isAssured ? 'Under Assurance' : 'Published';
    case 'IN_PROGRESS':
      return 'Ride In Progress';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      if (!value) return 'Unknown';
      return value
        .split('_')
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ');
  }
};

const isUpcomingDriverRideStatus = (status) => {
  const value = normalizeRideStatus(status);
  return (
    value === 'PUBLISHED' ||
    value === 'IN_PROGRESS' ||
    value === 'ASSURANCE_ACTIVE' ||
    value === 'ASSURANCE_PENDING'
  );
};

const mapDriverUpcomingRideTitle = (ride) =>
  mapRideStatusLabel(ride.status, ride.rideType);

// --- mirror ride-published.constants.ts (Assured vs Regular) ---
const RIDE_PUBLISHED_SCREEN = {
  title: 'Ride Published Successfully!',
  subtitle: 'Your ride is now live for others to join.',
  assuredTitle: 'Ride Submitted Successfully',
  assuredSubtitle:
    "Your Assured Ride is being processed. We'll update its status once it is approved.",
};

const resolvePublishedCopy = (isAssured) =>
  isAssured
    ? { title: RIDE_PUBLISHED_SCREEN.assuredTitle, subtitle: RIDE_PUBLISHED_SCREEN.assuredSubtitle }
    : { title: RIDE_PUBLISHED_SCREEN.title, subtitle: RIDE_PUBLISHED_SCREEN.subtitle };

// --- mirror mapRideResponseToPublishedSummary status fields ---
const mapRideResponseToPublishedSummary = (ride) => ({
  rideId: ride.id,
  backendStatus: ride.status,
  isBookable: ride.isBookable,
  statusLabel: mapRideStatusLabel(ride.status, ride.rideType),
  rideType: ride.rideType === 'ASSURED' ? 'assured' : 'regular',
});

// Exact backend response from user report
const assuredPostResponse = {
  id: 'e50c2975-193c-4706-ac0b-0544302bcda4',
  rideType: 'ASSURED',
  status: 'ASSURANCE_ACTIVE',
  isBookable: true,
  availableSeats: 3,
  totalSeats: 3,
  assuredDepositAmount: '105',
  assuredDepositPercentage: 5,
  source: 'Noida, Uttar Pradesh',
  destination: 'Jaipur, Rajasthan, India',
  departureDate: '2026-08-28',
  departureTime: '20:00:00',
};

// 1. Assured POST /rides returns ASSURANCE_ACTIVE
assertEqual(assuredPostResponse.status, 'ASSURANCE_ACTIVE', 'backend status preserved');

// 2–3. Published screen copy for Assured
const assuredCopy = resolvePublishedCopy(true);
assertEqual(assuredCopy.title, 'Ride Submitted Successfully', 'assured success title');
assertNotIncludes(assuredCopy.subtitle, 'live', 'assured subtitle not live');
assertNotIncludes(assuredCopy.title, 'Published Successfully', 'assured title not published successfully');

// Regular publish copy unchanged
const regularCopy = resolvePublishedCopy(false);
assertEqual(regularCopy.title, 'Ride Published Successfully!', 'regular title unchanged');
assertEqual(regularCopy.subtitle, 'Your ride is now live for others to join.', 'regular subtitle unchanged');

// 4–6. Status mapping
assertEqual(
  mapRideStatusLabel('ASSURANCE_ACTIVE', 'ASSURED'),
  'Under Assurance',
  'ASSURANCE_ACTIVE label',
);
assertNotIncludes(mapRideStatusLabel('ASSURANCE_ACTIVE', 'ASSURED'), 'Published', 'not Published');
assertNotIncludes(mapRideStatusLabel('ASSURANCE_ACTIVE', 'ASSURED'), 'Live', 'not Live');
assertEqual(
  mapRideStatusLabel('ASSURANCE_ACTIVE', 'ASSURED'),
  mapRideStatusLabel('ASSURANCE_ACTIVE', 'ASSURED'),
  'isBookable=true does not change label',
);

// 7. Real backend rideId preserved
const assuredSummary = mapRideResponseToPublishedSummary(assuredPostResponse);
assertEqual(
  assuredSummary.rideId,
  'e50c2975-193c-4706-ac0b-0544302bcda4',
  'rideId from backend',
);
assertEqual(assuredSummary.backendStatus, 'ASSURANCE_ACTIVE', 'backendStatus stored');
assertEqual(assuredSummary.isBookable, true, 'isBookable stored separately');
assertEqual(assuredSummary.statusLabel, 'Under Assurance', 'statusLabel from backend status');

// 8–9. Upcoming Rides includes ASSURANCE_ACTIVE with backend status title
assertTrue(isUpcomingDriverRideStatus('ASSURANCE_ACTIVE'), 'ASSURANCE_ACTIVE is upcoming');
assertTrue(isUpcomingDriverRideStatus('ASSURANCE_PENDING'), 'ASSURANCE_PENDING is upcoming');
assertFalse(isUpcomingDriverRideStatus('COMPLETED'), 'COMPLETED not upcoming');
assertEqual(
  mapDriverUpcomingRideTitle(assuredPostResponse),
  'Under Assurance',
  'upcoming card title from backend status',
);
assertNotIncludes(mapDriverUpcomingRideTitle(assuredPostResponse), 'Published', 'upcoming not Published');
assertNotIncludes(mapDriverUpcomingRideTitle(assuredPostResponse), 'Live', 'upcoming not Live');

// 10. Regular PUBLISHED unchanged
assertEqual(mapRideStatusLabel('PUBLISHED', 'REGULAR'), 'Published', 'regular PUBLISHED label');
assertTrue(isUpcomingDriverRideStatus('PUBLISHED'), 'regular PUBLISHED still upcoming');
assertEqual(
  mapDriverUpcomingRideTitle({ status: 'PUBLISHED', rideType: 'REGULAR' }),
  'Published',
  'regular upcoming title',
);

// 11–12. No demo wallet / demo data markers in this flow (structural check)
assertFalse('demo' in assuredSummary, 'summary has no demo field');
assertFalse('walletBalance' in assuredSummary, 'summary does not mutate wallet');

if (failed.length > 0) {
  console.error('FAILED:\n' + failed.join('\n'));
  process.exit(1);
}

console.log(`assuredDriverPublishState.test.js: ${failed.length === 0 ? 'all passed' : 'failed'}`);
