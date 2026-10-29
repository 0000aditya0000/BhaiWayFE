import type { ActiveRideItemDto, ApiActiveRideRole } from '@/features/offer-ride/api/rides.types';

import { ACTIVE_RIDE_COPY, ACTIVE_RIDE_TYPE_LABELS } from '../constants/active-ride.constants';

export interface ActiveRideView {
  key: string;
  rideId: string;
  bookingId: string | null;
  role: ApiActiveRideRole;
  rideType: string;
  typeLabel: string;
  roleLabel: string;
  source: string;
  destination: string;
  routeLabel: string;
  fareLabel: string | null;
  otp: string | null;
  totalPassengers: number | null;
  totalPassengersLabel: string | null;
  totalFareLabel: string | null;
  direction: 'OUTBOUND' | 'RETURN' | null;
  seriesId: string | null;
  occurrenceDate: string | null;
}

const shortPlace = (value: string): string => {
  const segment = value.split(',')[0]?.trim();
  return segment && segment.length > 0 ? segment : value.trim();
};

const normalizeRole = (role: string | null | undefined): ApiActiveRideRole | null => {
  const value = String(role ?? '').trim().toUpperCase();
  if (value === 'DRIVER') {
    return 'DRIVER';
  }
  if (value === 'PASSENGER') {
    return 'PASSENGER';
  }
  return null;
};

const normalizeDirection = (
  direction: string | null | undefined,
): 'OUTBOUND' | 'RETURN' | null => {
  const value = String(direction ?? '').trim().toUpperCase();
  if (value === 'RETURN') {
    return 'RETURN';
  }
  if (value === 'OUTBOUND') {
    return 'OUTBOUND';
  }
  return null;
};

const normalizeRideType = (rideType: string | null | undefined): string =>
  String(rideType ?? '').trim().toUpperCase();

/** Integer-point snapshot from the backend. Does not recompute fares. */
export const parseActiveRidePoints = (
  raw: string | number | null | undefined,
): number | null => {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim();
    const amount = Number(trimmed);
    return Number.isFinite(amount) ? amount : null;
  }
  return null;
};

export const formatActiveRidePoints = (
  raw: string | number | null | undefined,
): string | null => {
  const amount = parseActiveRidePoints(raw);
  if (amount == null) {
    return null;
  }
  return amount.toLocaleString('en-IN', {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  });
};

export const activeRideTypeLabel = (
  rideType: string | null | undefined,
  direction?: string | null,
): string => {
  const type = normalizeRideType(rideType);
  const dir = normalizeDirection(direction);
  if (type === 'ASSURED') {
    return ACTIVE_RIDE_TYPE_LABELS.ASSURED;
  }
  if (type === 'COMMUTE') {
    if (dir === 'RETURN') {
      return `${ACTIVE_RIDE_TYPE_LABELS.COMMUTE} · Return`;
    }
    if (dir === 'OUTBOUND') {
      return `${ACTIVE_RIDE_TYPE_LABELS.COMMUTE} · Outbound`;
    }
    return ACTIVE_RIDE_TYPE_LABELS.COMMUTE;
  }
  if (type === 'REGULAR') {
    return ACTIVE_RIDE_TYPE_LABELS.REGULAR;
  }
  return type || ACTIVE_RIDE_TYPE_LABELS.REGULAR;
};

export const activeRideSelectionKey = (item: {
  rideId?: string | null;
  role?: string | null;
  bookingId?: string | null;
}): string => {
  const rideId = String(item.rideId ?? '').trim();
  const role = normalizeRole(item.role) ?? 'UNKNOWN';
  const bookingId = String(item.bookingId ?? '').trim();
  return `${role}:${rideId}:${bookingId}`;
};

const visiblePassengerOtp = (
  role: ApiActiveRideRole,
  otp: string | null | undefined,
): string | null => {
  if (role !== 'PASSENGER') {
    return null;
  }
  const value = otp == null ? '' : String(otp).trim();
  return value.length > 0 ? value : null;
};

export const mapActiveRideItem = (item: ActiveRideItemDto): ActiveRideView | null => {
  const rideId = String(item.rideId ?? '').trim();
  const role = normalizeRole(item.role);
  if (!rideId || !role) {
    return null;
  }

  const source = String(item.source ?? '').trim() || 'Pickup';
  const destination = String(item.destination ?? '').trim() || 'Drop-off';
  const bookingId = item.bookingId != null ? String(item.bookingId).trim() || null : null;
  const direction = normalizeDirection(item.direction);
  const isPassenger = role === 'PASSENGER';
  const fareLabel = isPassenger ? formatActiveRidePoints(item.fare) : null;
  const totalFareLabel = isPassenger ? null : formatActiveRidePoints(item.totalFare);
  const totalPassengers =
    !isPassenger && item.totalPassengers != null && Number.isFinite(Number(item.totalPassengers))
      ? Math.max(0, Math.round(Number(item.totalPassengers)))
      : null;

  return {
    key: activeRideSelectionKey({ rideId, role, bookingId }),
    rideId,
    bookingId: isPassenger ? bookingId : null,
    role,
    rideType: normalizeRideType(item.rideType),
    typeLabel: activeRideTypeLabel(item.rideType, item.direction),
    roleLabel: isPassenger ? ACTIVE_RIDE_COPY.ridingLabel : ACTIVE_RIDE_COPY.drivingLabel,
    source,
    destination,
    routeLabel: `${shortPlace(source)} → ${shortPlace(destination)}`,
    fareLabel,
    otp: visiblePassengerOtp(role, item.otp),
    totalPassengers,
    totalPassengersLabel:
      totalPassengers == null
        ? null
        : `${totalPassengers} passenger${totalPassengers === 1 ? '' : 's'}`,
    totalFareLabel,
    direction,
    seriesId: item.seriesId != null ? String(item.seriesId).trim() || null : null,
    occurrenceDate:
      item.occurrenceDate != null ? String(item.occurrenceDate).trim() || null : null,
  };
};

export const mapActiveRideItems = (items: readonly ActiveRideItemDto[]): ActiveRideView[] => {
  const mapped: ActiveRideView[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const view = mapActiveRideItem(item);
    if (!view || seen.has(view.key)) {
      continue;
    }
    seen.add(view.key);
    mapped.push(view);
  }
  return mapped;
};

export const shouldShowActiveRideContainer = (items: readonly ActiveRideView[]): boolean =>
  items.length > 0;
