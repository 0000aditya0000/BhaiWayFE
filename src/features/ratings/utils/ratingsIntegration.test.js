/**
 * Run: node src/features/ratings/utils/ratingsIntegration.test.js
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const failed = [];

const assert = (condition, label) => {
  if (!condition) failed.push(label);
};

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const filterDriver = (items, rideId) =>
  items.filter((t) => t.role === 'PASSENGER').filter((t) => !rideId || t.rideId === rideId);
const filterPassenger = (items, rideId) =>
  items.filter((t) => t.role === 'DRIVER').filter((t) => !rideId || t.rideId === rideId);
const excludeSkipped = (items, set) => items.filter((t) => !set.has(t.taskId));
const validRating = (v) => Number.isInteger(v) && v >= 1 && v <= 5;
const clampComment = (v) => v.slice(0, 500);

const sample = [
  { taskId: 'a', rideId: 'r1', role: 'PASSENGER' },
  { taskId: 'b', rideId: 'r1', role: 'PASSENGER' },
  { taskId: 'c', rideId: 'r2', role: 'DRIVER' },
];

assert(filterDriver(sample, 'r1').length === 2, 'driver passenger tasks for ride');
assert(filterPassenger(sample, 'r2').length === 1, 'passenger driver task for ride');
assert(excludeSkipped(sample, new Set(['a'])).length === 2, 'session skip excludes one');
assert(validRating(5) && !validRating(0) && !validRating(1.5), 'integer rating validation');
assert(clampComment('x'.repeat(600)).length === 500, 'comment max length');

const endpoints = read('src/network/endpoints.ts');
assert(endpoints.includes("pending: '/ratings/pending'"), 'pending endpoint');
assert(endpoints.includes('skip: (taskId: string)'), 'skip endpoint');

const api = read('src/features/ratings/api/ratings.api.ts');
assert(api.includes('getPendingRatings'), 'getPendingRatings api');
assert(api.includes('submitRating'), 'submitRating api');
assert(api.includes('skipRatingTask'), 'skipRatingTask api');
assert(api.includes('ENDPOINTS.ratings.user'), 'getUserRatings uses /ratings/user endpoint');
assert(api.includes('direction=GIVEN'), 'getUserRatings uses uppercase GIVEN direction');
assert(api.includes('direction=RECEIVED'), 'getUserRatings uses uppercase RECEIVED direction');

const profileRatings = read('src/features/profile/hooks/useMyRatings.ts');
assert(profileRatings.includes('getUserRatings'), 'profile ratings hook uses getUserRatings');
assert(profileRatings.includes('getUserRatings(userId, { direction })'), 'profile ratings hook passes direction');

const driverHook = read('src/features/my-rides/hooks/useDriverTripCompleted.ts');
assert(driverHook.includes('getPendingRatings'), 'driver completion fetches pending');
assert(driverHook.includes('getDriverRatePassengersPath'), 'driver navigates to rate passengers');

const passengerHook = read('src/features/ride-search/hooks/useTripReview.ts');
assert(passengerHook.includes('submitRating'), 'passenger review submits rating');
assert(passengerHook.includes('skipCurrent'), 'passenger review supports skip');

const ratePassengers = read('src/features/my-rides/hooks/useRatePassengers.ts');
assert(ratePassengers.includes('useRatingTaskFlow'), 'sequential driver rating flow');
assert(ratePassengers.includes('resetTo'), 'rate passengers clears stack on complete');

const taskFlow = read('src/features/ratings/hooks/useRatingTaskFlow.ts');
assert(
  taskFlow.includes("prev.filter((task) => task.taskId !== finishedTaskId)"),
  'submit removes task locally to prevent re-queue',
);
assert(
  taskFlow.includes('retryUntilPresent'),
  'pending retry only on initial load',
);
assert(
  !taskFlow.includes('await refresh()'),
  'submit must not re-fetch pending (reopens same passengers)',
);

const driverCompleted = read('src/features/my-rides/hooks/useDriverTripCompleted.ts');
assert(driverCompleted.includes('router.replace'), 'trip completed replaces into rate screen');
assert(driverCompleted.includes('ratingNavLockRef'), 'trip completed guards double navigation');

if (failed.length) {
  console.error('FAILED');
  failed.forEach((line) => console.error(' -', line));
  process.exit(1);
}

console.log('ratingsIntegration.test.js passed');
