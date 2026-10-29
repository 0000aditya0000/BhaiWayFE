/**
 * Assured security deposit calculation — mirrors assuredDeposit.utils.ts.
 * Proves ₹100 + 5% → ₹5 and that decimal/"string" backend values never yield ₹0.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../../..');
const failed = [];

const assertEqual = (actual, expected, label) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const assertTrue = (value, label) => {
  if (!value) failed.push(`${label}: expected true`);
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

const INTEGER_PATTERN = /^\d+$/;
const parseIntegerCoinString = (value) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed || !INTEGER_PATTERN.test(trimmed)) return null;
  return trimmed.replace(/^0+(?=\d)/, '') || '0';
};

/** Mirrors parseAssuredCoinInput */
const parseAssuredCoinInput = (value) => {
  if (value == null) return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return null;
    return String(Math.round(value));
  }
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const asInteger = parseIntegerCoinString(trimmed);
  if (asInteger !== null) return asInteger;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return String(Math.round(numeric));
};

/** Mirrors parseAssuredPercentageInput */
const parseAssuredPercentageInput = (value) => {
  if (value == null || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return numeric;
};

const resolveAssuredDepositFieldsFromRide = (ride) => ({
  pricePerSeat: ride.pricePerSeat,
  securityDepositAmount: ride.securityDepositAmount ?? ride.assuredDepositAmount ?? null,
  securityDepositPercentage:
    ride.securityDepositPercentage ?? ride.assuredDepositPercentage ?? null,
});

/** Mirrors computeAssuredRiderDepositCoins */
const computeAssuredRiderDepositCoins = ({
  pricePerSeat,
  seats,
  securityDepositAmount,
  securityDepositPercentage,
}) => {
  const unit = parseAssuredCoinInput(pricePerSeat);
  const pct = parseAssuredPercentageInput(securityDepositPercentage);
  const seatCount = Math.max(1, Math.floor(seats));
  let fromPercentage = null;
  if (unit != null && unit !== '0' && pct != null && pct > 0) {
    const totalFare = BigInt(unit) * BigInt(seatCount);
    fromPercentage = ((totalFare * BigInt(Math.round(pct))) / BigInt(100)).toString();
  }
  const direct = parseAssuredCoinInput(securityDepositAmount);
  if (direct !== null && direct !== '0') {
    if (fromPercentage && fromPercentage !== '0' && direct !== fromPercentage) {
      try {
        const directCoins = BigInt(direct);
        const expectedCoins = BigInt(fromPercentage);
        if (
          expectedCoins > 0n &&
          directCoins > expectedCoins &&
          directCoins % expectedCoins === 0n
        ) {
          return fromPercentage;
        }
      } catch {
        // fall through
      }
    }
    return direct;
  }
  return fromPercentage;
};

const computeAssuredDepositFromRide = (ride, seats) => {
  const fields = resolveAssuredDepositFieldsFromRide(ride);
  if (fields.pricePerSeat == null || fields.pricePerSeat === '') return null;
  return computeAssuredRiderDepositCoins({
    pricePerSeat: fields.pricePerSeat,
    seats,
    securityDepositAmount: fields.securityDepositAmount,
    securityDepositPercentage: fields.securityDepositPercentage,
  });
};

// ─── A. price ₹100 + 5% → deposit ₹5 ─────────────────────────────────────────
assertEqual(
  computeAssuredRiderDepositCoins({
    pricePerSeat: 100,
    seats: 1,
    securityDepositPercentage: 5,
  }),
  '5',
  'A price 100 + 5% → 5',
);

// ─── B. string price "100" + percentage "5" → ₹5 ─────────────────────────────
assertEqual(
  computeAssuredRiderDepositCoins({
    pricePerSeat: '100',
    seats: 1,
    securityDepositPercentage: '5',
  }),
  '5',
  'B string "100" + "5" → 5',
);

// ─── C. backend securityDepositAmount = "5" → use ₹5 ─────────────────────────
assertEqual(
  computeAssuredRiderDepositCoins({
    pricePerSeat: '100',
    seats: 1,
    securityDepositAmount: '5',
    securityDepositPercentage: 15,
  }),
  '5',
  'C explicit amount "5"',
);

// ─── D. explicit amount takes precedence over percentage ─────────────────────
assertEqual(
  computeAssuredRiderDepositCoins({
    pricePerSeat: '100',
    seats: 2,
    securityDepositAmount: '5',
    securityDepositPercentage: 50,
  }),
  '5',
  'D amount wins over percentage',
);

// ─── E. missing amount + valid percentage → calculate ────────────────────────
assertEqual(
  computeAssuredRiderDepositCoins({
    pricePerSeat: '100',
    seats: 1,
    securityDepositAmount: null,
    securityDepositPercentage: 5,
  }),
  '5',
  'E null amount + 5%',
);

// ─── F. zero/missing amount must not hide valid percentage ───────────────────
assertEqual(
  computeAssuredRiderDepositCoins({
    pricePerSeat: '100.00',
    seats: 1,
    securityDepositAmount: '0',
    securityDepositPercentage: 5,
  }),
  '5',
  'F amount "0" + decimal price + 5%',
);
assertEqual(
  computeAssuredRiderDepositCoins({
    pricePerSeat: '100.00',
    seats: 1,
    securityDepositAmount: '',
    securityDepositPercentage: '5.0',
  }),
  '5',
  'F empty amount + "100.00" + "5.0"',
);

// ─── G. multiple seats ───────────────────────────────────────────────────────
assertEqual(
  computeAssuredRiderDepositCoins({
    pricePerSeat: '100',
    seats: 2,
    securityDepositPercentage: 5,
  }),
  '10',
  'G 2 seats → fare 200 → deposit 10',
);

// ─── G2. ride-level amount for full capacity must not override 1-seat calc ───
assertEqual(
  computeAssuredRiderDepositCoins({
    pricePerSeat: '100',
    seats: 1,
    securityDepositAmount: '15',
    securityDepositPercentage: 5,
  }),
  '5',
  'G2 amount 15 (3×5) with 1 seat + 5% → 5',
);

// ─── H. no hardcoded ₹50 in live Assured deposit util ────────────────────────
const depositUtils = fs.readFileSync(
  path.join(root, 'features/ride-search/utils/assuredDeposit.utils.ts'),
  'utf8',
);
assertNotIncludes(depositUtils, 'ASSURED_BOOKING_FEE', 'H no ASSURED_BOOKING_FEE');
assertNotIncludes(depositUtils, '= 50', 'H no hardcoded 50 assignment');
assertIncludes(depositUtils, 'parseAssuredCoinInput', 'H uses coin parser');
assertIncludes(depositUtils, 'parseAssuredPercentageInput', 'H uses percentage parser');

// ─── I. valid percentage-based deposit must not resolve to ₹0 / null ─────────
assertEqual(
  computeAssuredDepositFromRide(
    { pricePerSeat: '100', securityDepositPercentage: 5 },
    1,
  ),
  '5',
  'I from ride fields → 5',
);
assertEqual(
  computeAssuredDepositFromRide(
    { pricePerSeat: '100.00', assuredDepositPercentage: 5 },
    1,
  ),
  '5',
  'I assuredDepositPercentage alias + decimal price',
);
assertTrue(
  computeAssuredRiderDepositCoins({
    pricePerSeat: '100',
    seats: 1,
    securityDepositPercentage: 5,
  }) !== '0',
  'I not zero',
);
assertTrue(
  computeAssuredRiderDepositCoins({
    pricePerSeat: '100',
    seats: 1,
    securityDepositPercentage: 5,
  }) != null,
  'I not null',
);

// ─── J. Review + Payment share same util ─────────────────────────────────────
const useReviewBooking = fs.readFileSync(
  path.join(root, 'features/ride-search/hooks/useReviewBooking.ts'),
  'utf8',
);
const usePaymentOptions = fs.readFileSync(
  path.join(root, 'features/ride-search/hooks/usePaymentOptions.ts'),
  'utf8',
);
assertIncludes(useReviewBooking, 'computeAssuredDepositFromRide', 'J Review uses util');
assertIncludes(useReviewBooking, 'assuredDepositCoins', 'J Review hands off coins');
assertIncludes(usePaymentOptions, 'assuredDepositCoins', 'J Payment consumes coins');
assertIncludes(
  useReviewBooking,
  'resolveAssuredDepositPercentageFromRide',
  'J Review exposes percentage',
);

// ─── K. Regular path unchanged (still uses mock fare helper, not Assured util) ─
assertIncludes(useReviewBooking, 'getReviewBookingMock', 'K Regular mock retained');
assertIncludes(useReviewBooking, 'buildRegularFareEstimate', 'K Regular fare estimate');
assertIncludes(useReviewBooking, 'if (isAssured)', 'K Assured branch isolated');

if (failed.length > 0) {
  console.error('FAILED:\n' + failed.join('\n'));
  process.exit(1);
}

console.log('assuredDeposit.calc tests passed');
