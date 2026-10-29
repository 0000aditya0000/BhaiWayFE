/**
 * Pure Node mirror of richer GET /rides/history/:id earnings + vehicle mapping.
 * Avoids RN barrel imports from mapRideHistory.ts.
 */
const assert = require('node:assert/strict');

const HISTORY_UNAVAILABLE_LABEL = 'Unavailable';

const hasMoneyValue = (raw) => raw != null && raw !== '';

const parseMoneySnapshot = (raw) => {
  if (raw == null || raw === '') return NaN;
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
  return Number.isFinite(n) ? n : NaN;
};

const resolveEarningsBreakdown = (dto) => {
  const nested = dto.earnings ?? {};
  return {
    passengerTotal: nested.passengerTotal ?? dto.passengerTotal ?? null,
    driverShare:
      nested.driverShare ??
      nested.driverShareAmount ??
      dto.driverShare ??
      dto.driverShareAmount ??
      null,
    platformShare: nested.platformShare ?? dto.platformShare ?? null,
    assuredBonus: nested.assuredBonus ?? dto.assuredBonus ?? null,
    otherEarnings: nested.otherEarnings ?? dto.otherEarnings ?? null,
    total: nested.total ?? dto.total ?? dto.totalEarnings ?? null,
  };
};

const resolvePassengerAmount = (passenger) => {
  const driverShare = passenger.driverShare ?? passenger.driverShareAmount ?? null;
  const fare = passenger.fareAmount ?? passenger.totalAmount ?? null;
  return hasMoneyValue(driverShare) ? driverShare : fare;
};

const resolveVehicleLabel = (vehicle) => {
  if (!vehicle) return '';
  return [vehicle.color, vehicle.make, vehicle.model, vehicle.variant]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ')
    .trim();
};

const formatDurationLabel = (minutes) => {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) {
    return HISTORY_UNAVAILABLE_LABEL;
  }
  return `${Math.round(minutes)} mins`;
};

const formatDistanceLabel = (km) => {
  if (km == null || !Number.isFinite(km) || km <= 0) {
    return HISTORY_UNAVAILABLE_LABEL;
  }
  const rounded = km >= 100 ? Math.round(km) : Math.round(km * 10) / 10;
  return `${rounded} km`;
};

const rich = {
  id: 'ride-1',
  rideType: 'ASSURED',
  status: 'COMPLETED',
  durationMinutes: 45,
  distanceKm: 18.4,
  sourceLatitude: 28.5245,
  sourceLongitude: 77.2066,
  destinationLatitude: 28.4949,
  destinationLongitude: 77.0882,
  startedAt: '2026-08-20T09:35:00.000Z',
  earnings: {
    passengerTotal: '300',
    driverShare: '270',
    platformShare: '30',
    assuredBonus: '50',
    otherEarnings: '10',
    total: '330',
  },
  passengers: [
    { bookingId: 'b1', fareAmount: '150', driverShare: '135', platformShare: '15' },
    { bookingId: 'b2', fareAmount: '150', driverShare: '135', platformShare: '15' },
  ],
  vehicle: {
    vehicleType: 'CAR',
    make: 'Honda',
    model: 'City',
    variant: 'VX',
    color: 'White',
    registrationNumber: 'DL 01 AB 1234',
    registrationYear: 2022,
    seatingCapacity: 5,
    isVerified: true,
  },
};

const earnings = resolveEarningsBreakdown(rich);
assert.equal(earnings.total, '330');
assert.equal(earnings.driverShare, '270');
assert.equal(earnings.platformShare, '30');
assert.equal(earnings.assuredBonus, '50');
assert.equal(earnings.otherEarnings, '10');

assert.equal(resolvePassengerAmount(rich.passengers[0]), '135');
assert.equal(resolveVehicleLabel(rich.vehicle), 'White Honda City VX');
assert.equal(formatDurationLabel(rich.durationMinutes), '45 mins');
assert.equal(formatDistanceLabel(rich.distanceKm), '18.4 km');
assert.equal(Boolean(rich.vehicle.isVerified), true);
assert.equal(parseMoneySnapshot(earnings.total), 330);

const legacy = resolveEarningsBreakdown({
  totalEarnings: '300',
  assuredBonus: '50',
});
assert.equal(legacy.total, '300');
assert.equal(legacy.assuredBonus, '50');

assert.equal(formatDurationLabel(null), HISTORY_UNAVAILABLE_LABEL);
assert.equal(formatDistanceLabel(null), HISTORY_UNAVAILABLE_LABEL);

const coerceFiniteNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};
assert.equal(coerceFiniteNumber('18.4'), 18.4);
assert.equal(coerceFiniteNumber('45'), 45);
assert.equal(formatDistanceLabel(coerceFiniteNumber('18.4')), '18.4 km');
assert.equal(formatDurationLabel(coerceFiniteNumber('45')), '45 mins');

console.log('mapRideHistoryEarnings.test.js — all assertions passed');
