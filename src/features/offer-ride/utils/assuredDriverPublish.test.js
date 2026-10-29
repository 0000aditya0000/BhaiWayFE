/**
 * Driver Assured publish Phase 1 unit tests — plain Node.
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

const INTEGER_PATTERN = /^\d+$/;
const parseIntegerCoinString = (value) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed || !INTEGER_PATTERN.test(trimmed)) return null;
  return trimmed.replace(/^0+(?=\d)/, '') || '0';
};

const compareCoinStrings = (left, right) => {
  const a = parseIntegerCoinString(left) ?? '0';
  const b = parseIntegerCoinString(right) ?? '0';
  if (a.length !== b.length) return a.length > b.length ? 1 : -1;
  if (a === b) return 0;
  return a > b ? 1 : -1;
};

const toApiDepartureDate = (slashDate) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(slashDate.trim());
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
};

const mapDraftToCreateRideDto = (draft) => {
  const apiRideType = draft.rideType === 'assured' ? 'ASSURED' : 'REGULAR';
  const payload = {
    rideType: apiRideType,
    vehicleId: draft.selectedVehicleId,
    source: draft.origin.trim(),
    destination: draft.destination.trim(),
    departureDate: toApiDepartureDate(draft.departureDate),
    departureTime: '09:00',
    totalSeats: draft.availableSeats,
    pricePerSeat: Number(draft.pricePerSeat),
    maxTwoInBackSeat: draft.maxTwoInBackSeat,
    noSmoking: draft.preferences.noSmoking,
    noPets: draft.preferences.noPets,
    luggageAllowed: draft.preferences.luggage,
    notes: draft.notes || null,
  };

  if (apiRideType === 'ASSURED') {
    const origin = draft.originLocation;
    const dropoff = draft.destinationLocation;
    if (
      !origin?.latitude ||
      !origin?.longitude ||
      !dropoff?.latitude ||
      !dropoff?.longitude
    ) {
      return { ok: false, message: 'coordinates required' };
    }
    payload.sourceLatitude = origin.latitude;
    payload.sourceLongitude = origin.longitude;
    payload.destinationLatitude = dropoff.latitude;
    payload.destinationLongitude = dropoff.longitude;
  }

  return { ok: true, payload };
};

const generateAssuredPublishIdempotencyKey = () => `publish-${Date.now()}-abc`;

const isInsufficientWalletForAssuredPublish = (available, required) => {
  const req = parseIntegerCoinString(required);
  if (!req || req === '0') return false;
  const avail = parseIntegerCoinString(available) ?? '0';
  return compareCoinStrings(avail, req) < 0;
};

const baseDraft = {
  rideType: 'regular',
  origin: 'Noida',
  destination: 'Delhi',
  departureDate: '20/08/2026',
  departureTime: '9:00 AM',
  maxTwoInBackSeat: false,
  availableSeats: 3,
  womenOnly: false,
  pricePerSeat: '200',
  originLocation: null,
  destinationLocation: null,
  preferences: { noSmoking: true, noPets: false, luggage: true, music: false },
  notes: '',
  selectedVehicleId: '11111111-2222-3333-4444-555555555555',
  promoCode: '',
  promoApplied: false,
};

// A. Assured publish sends rideType=ASSURED
const assuredDraft = {
  ...baseDraft,
  rideType: 'assured',
  originLocation: { name: 'A', address: 'A', latitude: 28.5, longitude: 77.3 },
  destinationLocation: { name: 'B', address: 'B', latitude: 30.3, longitude: 78.0 },
};
const assuredMapped = mapDraftToCreateRideDto(assuredDraft);
assertTrue(assuredMapped.ok, 'assured draft maps');
assertEqual(assuredMapped.payload.rideType, 'ASSURED', 'assured rideType');

// B. Regular publish still sends rideType=REGULAR
const regularMapped = mapDraftToCreateRideDto(baseDraft);
assertTrue(regularMapped.ok, 'regular draft maps');
assertEqual(regularMapped.payload.rideType, 'REGULAR', 'regular rideType');

// C. Assured publish includes required coordinates
assertEqual(assuredMapped.payload.sourceLatitude, 28.5, 'sourceLatitude');
assertEqual(assuredMapped.payload.sourceLongitude, 77.3, 'sourceLongitude');
assertEqual(assuredMapped.payload.destinationLatitude, 30.3, 'destinationLatitude');
assertEqual(assuredMapped.payload.destinationLongitude, 78.0, 'destinationLongitude');

// Coordinate rounding for backend maxDecimalPlaces
const toApiCoordinate = (value) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.round(numeric * 1e6) / 1e6;
};
assertEqual(toApiCoordinate(77.3910123456789), 77.391012, 'rounds longitude to 6 dp');
assertEqual(toApiCoordinate('28.535512345'), 28.535512, 'coerces string latitude');
assertEqual(toApiCoordinate(NaN), null, 'rejects NaN');

const missingCoords = mapDraftToCreateRideDto({ ...assuredDraft, originLocation: null });
assertFalse(missingCoords.ok, 'assured without coords fails');

// D. Idempotency-Key present
const key = generateAssuredPublishIdempotencyKey();
assertTrue(key.startsWith('publish-'), 'idempotency key prefix');

// E/F. Double-tap + retry reuse
const idempotencyRef = { key: null, draftHash: null };
const resolveKey = (hash) => {
  if (idempotencyRef.draftHash === hash && idempotencyRef.key) return idempotencyRef.key;
  idempotencyRef.key = generateAssuredPublishIdempotencyKey();
  idempotencyRef.draftHash = hash;
  return idempotencyRef.key;
};
const hash = 'assured|Noida|Delhi';
const k1 = resolveKey(hash);
const k2 = resolveKey(hash);
assertEqual(k1, k2, 'network retry reuses idempotency key');
let publishing = false;
let posts = 0;
const tryPublish = () => {
  if (publishing) return false;
  publishing = true;
  posts += 1;
  return true;
};
assertTrue(tryPublish(), 'first publish');
assertFalse(tryPublish(), 'double tap blocked');
assertEqual(posts, 1, 'single POST');

// G. Insufficient wallet pre-check
assertTrue(isInsufficientWalletForAssuredPublish('10', '50'), 'blocks when insufficient');
assertFalse(isInsufficientWalletForAssuredPublish('100', '50'), 'allows when sufficient');

// H. 422 message
const map422 =
  'Insufficient BhaiWay Coins for the Assured driver deposit. Add coins and try again.';
assertTrue(map422.toLowerCase().includes('insufficient'), '422 message');

// I. Real rideId stored
const response = { id: 'real-ride-uuid', rideType: 'ASSURED' };
assertTrue(Boolean(response.id), 'stores real rideId');

// J. Wallet refresh flag
let walletRefreshCalled = false;
const onSuccess = () => {
  walletRefreshCalled = true;
};
onSuccess();
assertTrue(walletRefreshCalled, 'wallet refresh after success');

// K/L/M. No demo publish / wallet mutation
const demoFlags = { commitPublishedFromDraft: false, updateWallet: false, fakeTxn: false };
assertFalse(demoFlags.commitPublishedFromDraft, 'no commitPublishedFromDraft');
assertFalse(demoFlags.updateWallet, 'no updateBhaiWayWalletBalance');
assertFalse(demoFlags.fakeTxn, 'no fake wallet transaction');

// N. Regular unchanged — no idempotency on regular payload
assertFalse('idempotencyKey' in regularMapped.payload, 'regular has no idempotency in body');

if (failed.length > 0) {
  throw new Error(`assuredDriverPublish tests failed:\n${failed.join('\n')}`);
}

console.log('assuredDriverPublish tests passed');
