import { parseIntegerCoinString } from '@/features/profile/utils/walletCoin';
import type { BookingResponseDto } from '@/features/ride-search/api/bookings.types';
import type { RideSearchItemDto } from '@/features/ride-search/api/ridesSearch.types';
import type { MapCoordinate } from '@/features/ride-search/types';
import { parsePricePerSeat } from '@/features/ride-search/utils/rideSearch.mapper';

export const COMMUTE_API_RIDE_TYPE = 'COMMUTE' as const;
export const COMMUTE_BOOKING_MODE = 'COMMUTE' as const;

export const isCommuteApiRideType = (rideType: string | null | undefined): boolean =>
  String(rideType ?? '')
    .trim()
    .toUpperCase() === COMMUTE_API_RIDE_TYPE;

export const isCommuteBooking = (booking: Pick<BookingResponseDto, 'bookingMode'>): boolean =>
  String(booking.bookingMode ?? '')
    .trim()
    .toUpperCase() === COMMUTE_BOOKING_MODE;

/**
 * Passenger-facing Commute fare per seat — riderPricePerSeat when backend sends it.
 * Never exposes driver pricePerSeat to the passenger UI.
 */
export const resolveCommuteRiderPricePerSeat = (
  ride: Pick<RideSearchItemDto, 'riderPricePerSeat' | 'pricePerSeat'>,
): number => {
  const riderRaw = ride.riderPricePerSeat;
  if (riderRaw != null && String(riderRaw).trim() !== '') {
    return parsePricePerSeat(String(riderRaw));
  }
  return parsePricePerSeat(String(ride.pricePerSeat ?? '0'));
};

/** Total rider fare in integer coins (1 Coin = ₹1) for wallet pre-check. */
export const computeCommuteTotalFareCoins = (
  riderPricePerSeat: number,
  seats: number,
): string => {
  const safeSeats = Math.max(1, Math.floor(seats));
  const perSeat = Math.max(0, Math.round(riderPricePerSeat));
  return String(perSeat * safeSeats);
};

export const computeCommuteTotalFareAmount = (
  riderPricePerSeat: number,
  seats: number,
): number => {
  const coins = computeCommuteTotalFareCoins(riderPricePerSeat, seats);
  const parsed = parseIntegerCoinString(coins);
  return parsed != null ? Number(parsed) : 0;
};

/** Stable idempotency key for one Commute booking attempt. */
export const generateCommuteBookingIdempotencyKey = (): string => {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `commute-booking-${time}-${random}`;
};

const asApiRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return null;
};

const parsePercentInput = (value: unknown): number | null => {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = String(value).trim().replace(/%$/, '');
  if (!cleaned) {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeRouteMatchPercent = (raw: number): number | null => {
  if (!Number.isFinite(raw)) {
    return null;
  }
  let percent = raw;
  if (raw > 0 && raw <= 1) {
    percent = raw * 100;
  }
  return Math.min(100, Math.max(0, Math.round(percent)));
};

const readRouteMatchFromRecord = (record: Record<string, unknown> | null): number | null => {
  if (!record) {
    return null;
  }

  const directKeys = [
    'routeMatchPercent',
    'route_match_percent',
    'routeMatchPercentage',
    'route_match_percentage',
    'matchPercent',
    'match_percent',
    'matchPercentage',
    'match_percentage',
    'matchScore',
    'match_score',
    'corridorMatchPercent',
    'corridor_match_percent',
    'corridorMatchPercentage',
    'corridor_match_percentage',
    'routeMatch',
    'route_match',
    'overlapPercent',
    'overlap_percent',
  ];

  for (const key of directKeys) {
    const parsed = parsePercentInput(record[key]);
    if (parsed != null) {
      return normalizeRouteMatchPercent(parsed);
    }
  }

  const nestedKeys = [
    'corridorMatch',
    'corridor_match',
    'routeMatch',
    'route_match',
    'matching',
    'searchMatch',
    'search_match',
    'metadata',
    'searchMeta',
    'search_meta',
    'matchMeta',
    'match_meta',
  ];
  for (const nestedKey of nestedKeys) {
    const nested = asApiRecord(record[nestedKey]);
    const nestedValue = readRouteMatchFromRecord(nested);
    if (nestedValue != null) {
      return nestedValue;
    }
    const nestedPercent = parsePercentInput(nested?.percent ?? nested?.percentage ?? nested?.score);
    if (nestedPercent != null) {
      return normalizeRouteMatchPercent(nestedPercent);
    }
  }

  return null;
};

/**
 * Reads corridor / route match % from GET /rides/search or GET /rides/public/:id payloads.
 * Accepts camelCase, snake_case, nested objects, and 0–1 fractional scores.
 */
export const resolveRouteMatchPercentFromApi = (payload: unknown): number | null =>
  readRouteMatchFromRecord(asApiRecord(payload));

/** Valid map coordinate — rejects 0,0 and non-finite values. */
export const parseCommuteMapCoordinate = (
  latitude?: number | string | null,
  longitude?: number | string | null,
): MapCoordinate | null => {
  if (latitude == null || longitude == null || latitude === '' || longitude === '') {
    return null;
  }
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  if (lat === 0 && lng === 0) {
    return null;
  }
  return { latitude: lat, longitude: lng };
};

/** Passenger search coords first, then published ride endpoints from GET /rides/public/:id. */
export const resolveCommuteRideEndpoints = (
  ride: RideSearchItemDto,
  params: {
    originLat?: number;
    originLng?: number;
    destinationLat?: number;
    destinationLng?: number;
  },
): { pickup: MapCoordinate; dropoff: MapCoordinate } | null => {
  const pickup =
    parseCommuteMapCoordinate(params.originLat, params.originLng) ??
    parseCommuteMapCoordinate(ride.sourceLatitude, ride.sourceLongitude);
  const dropoff =
    parseCommuteMapCoordinate(params.destinationLat, params.destinationLng) ??
    parseCommuteMapCoordinate(ride.destinationLatitude, ride.destinationLongitude);

  if (!pickup || !dropoff) {
    return null;
  }

  return { pickup, dropoff };
};

export const buildCommuteCreateBookingPayload = (params: {
  rideId: string;
  seats: number;
  couponCode?: string | null;
  couponChargeScope?: 'RIDE_FARE' | 'ASSURED_SECURITY_DEPOSIT' | null;
}) => {
  const payload: {
    rideId: string;
    seats: number;
    paymentMethod: 'PAY_NOW';
    couponCode?: string;
    couponChargeScope?: 'RIDE_FARE' | 'ASSURED_SECURITY_DEPOSIT';
  } = {
    rideId: params.rideId.trim(),
    seats: Math.max(1, Math.floor(params.seats)),
    paymentMethod: 'PAY_NOW',
  };
  const code = params.couponCode?.trim().toUpperCase();
  if (code) {
    payload.couponCode = code;
    payload.couponChargeScope = params.couponChargeScope ?? 'RIDE_FARE';
  }
  return payload;
};
