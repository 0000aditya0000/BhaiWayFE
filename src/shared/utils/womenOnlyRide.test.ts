import {
  canBookWomenOnlyRide,
  extractApiErrorCode,
  formatApiGenderLabel,
  isWomenOnlyRideError,
  resolveWomenOnly,
  WOMEN_ONLY_RIDE_ERROR_CODE,
  WOMEN_ONLY_RIDE_MESSAGE,
} from './womenOnlyRide';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
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

assertEqual(resolveWomenOnly({ womenOnly: true }), true, 'top-level womenOnly');
assertEqual(resolveWomenOnly({ womenOnly: false }), false, 'top-level false');
assertEqual(
  resolveWomenOnly({ preferences: { womenOnly: true } }),
  true,
  'nested preferences.womenOnly',
);
assertEqual(resolveWomenOnly({}), false, 'missing defaults false');
assertEqual(
  resolveWomenOnly({ womenOnly: false, preferences: { womenOnly: true } }),
  false,
  'top-level wins over nested',
);

assertTrue(canBookWomenOnlyRide('FEMALE'), 'FEMALE can book');
assertFalse(canBookWomenOnlyRide('MALE'), 'MALE cannot book');
assertFalse(canBookWomenOnlyRide('OTHER'), 'OTHER cannot book');
assertFalse(canBookWomenOnlyRide('PREFER_NOT_TO_SAY'), 'PREFER_NOT_TO_SAY cannot book');
assertFalse(canBookWomenOnlyRide(null), 'null cannot book');
assertFalse(canBookWomenOnlyRide(undefined), 'undefined cannot book');

assertTrue(
  isWomenOnlyRideError({
    status: 403,
    code: WOMEN_ONLY_RIDE_ERROR_CODE,
    message: 'blocked',
  }),
  'detects code',
);
assertTrue(
  isWomenOnlyRideError({
    status: 403,
    details: { code: WOMEN_ONLY_RIDE_ERROR_CODE },
    message: 'x',
  }),
  'detects details.code',
);
assertFalse(
  isWomenOnlyRideError({ status: 403, code: 'OTHER', message: 'Identity required' }),
  'other 403 is not women-only',
);
assertEqual(
  extractApiErrorCode({ details: { error: { code: WOMEN_ONLY_RIDE_ERROR_CODE } } }),
  WOMEN_ONLY_RIDE_ERROR_CODE,
  'nested error.code',
);
assertEqual(formatApiGenderLabel('FEMALE'), 'Female', 'female label');
assertEqual(formatApiGenderLabel(null), 'Not verified yet', 'null label');
assertEqual(
  WOMEN_ONLY_RIDE_MESSAGE,
  'This ride is Women Only. Only verified female riders can book this ride.',
  'canonical message',
);

if (failed.length > 0) {
  throw new Error(`womenOnlyRide tests failed:\n${failed.join('\n')}`);
}

console.log('womenOnlyRide tests passed');
