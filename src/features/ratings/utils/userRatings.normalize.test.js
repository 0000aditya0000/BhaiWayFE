/**
 * Run: node src/features/ratings/utils/userRatings.normalize.test.js
 */
const {
  normalizeUserRatingItem,
  unwrapUserRatingsPage,
} = require('./userRatings.normalize.ts');

const failed = [];
const assert = (condition, label) => {
  if (!condition) failed.push(label);
};

assert(
  normalizeUserRatingItem({ id: 'r1', rating: 5, comment: 'Great' })?.rating === 5,
  'basic rating field',
);

assert(
  normalizeUserRatingItem({ taskId: 'task-1', score: 4, ratedAt: '2026-01-01' })?.id === 'task-1',
  'score + taskId accepted',
);

const ACTUAL_API_SAMPLE = {
  averageRating: 4.0,
  totalRatings: 2,
  total: 2,
  direction: 'RECEIVED',
  items: [
    {
      id: 'rating-1',
      taskId: 'task-1',
      rating: 5,
      comment: 'Great ride',
      createdAt: '2026-09-02T10:00:00.000Z',
      fromUser: { userId: 'driver-1', userName: 'Ravi', userPhoto: null },
      toUser: { userId: 'passenger-1', userName: 'You', userPhoto: null },
      role: 'DRIVER',
      ride: {
        rideId: 'ride-1',
        source: 'Noida',
        destination: 'Dehradun',
        departureDate: '2026-09-02',
        departureTime: '09:00',
      },
    },
  ],
};

const actualApi = unwrapUserRatingsPage(ACTUAL_API_SAMPLE);
assert(actualApi.items.length === 1, 'actual API items array');
assert(actualApi.averageRating === 4, 'actual API averageRating');
assert(actualApi.totalRatings === 2, 'actual API totalRatings');
assert(actualApi.direction === 'RECEIVED', 'actual API direction');
assert(actualApi.items[0]?.reviewerName === 'Ravi', 'fromUser.userName reviewer');
assert(actualApi.items[0]?.rideLabel === 'Noida → Dehradun', 'ride source/destination label');

assert(
  normalizeUserRatingItem({
    fromUser: { userName: 'Ravi' },
    rating: 5,
    id: 'x',
  })?.reviewerName === 'Ravi',
  'fromUser.userName nested field',
);

const fromRatingsKey = unwrapUserRatingsPage({
  ratings: [{ id: 'x', stars: 5 }],
  averageRating: 5,
  total: 1,
});
assert(fromRatingsKey.items.length === 1, 'ratings array key');
assert(fromRatingsKey.averageRating === 5, 'averageRating passthrough');

const fromNestedData = unwrapUserRatingsPage({
  data: {
    items: [{ _id: 'mongo-1', value: 5, comment: 'Nice' }],
    total: 1,
  },
});
assert(fromNestedData.items.length === 1, 'nested data.items');

const fromTopLevelArray = unwrapUserRatingsPage([
  { ratingId: 'rid-1', ratingScore: 2 },
]);
assert(fromTopLevelArray.items.length === 1, 'top-level array payload');

if (failed.length) {
  console.error('FAILED');
  failed.forEach((line) => console.error(' -', line));
  process.exit(1);
}

console.log('userRatings.normalize.test.js passed');
