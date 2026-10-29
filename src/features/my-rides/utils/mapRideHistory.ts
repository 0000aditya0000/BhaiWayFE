import type {
  RideHistoryEarningsDto,
  RideHistoryItemDto,
  RideHistoryPassengerEarningDto,
} from '@/features/offer-ride/api/ridesHistory.types';
import { parseMoneySnapshot } from '@/features/ride-search/api';
import { resolvePersonDisplayName } from '@/features/ride-search/api/bookingPersonName';
import { formatApiDepartureTime } from '@/features/ride-search/utils';
import { isValidMapCoordinate } from '@/shared/maps';
import { formatBhaiWayCoins, formatDisplayDate } from '@/shared/utils';

import type {
  DriverRideKind,
  HistoryRideItem,
  TripDetailsEarningsLine,
  TripDetailsSummary,
} from '../types';
import {
  formatInrAmount,
  formatInrBonus,
  getPassengerRideTag,
} from './driverEarnings';
import { rideKindFromAssuredFlag } from './driverRideKind';
import { isCommuteApiRideType } from './commuteMyRides.utils';
import {
  HISTORY_UNAVAILABLE_LABEL,
  mapHistoryStatusLabel,
  mapTripDetailsBadgeLabel,
  resolveHistoryCancelledAt,
  resolveHistoryStatusFromDto,
} from './historyStatus';
import { resolveHistoryEndedMs } from './sortMyRides';

const EARNINGS_LABELS = {
  passengerTotal: 'Passenger fares',
  platformShare: 'Platform share',
  assuredBonus: 'Assured Bonus',
  otherEarnings: 'Other earnings',
  fareSubtitlePrefix: 'Fare',
} as const;

const shortPlaceName = (value: string): string => {
  const segment = value.split(',')[0]?.trim();
  return segment && segment.length > 0 ? segment : value;
};

const formatCivilDateLabel = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return value.trim();
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const formatIsoTimestampLabel = (iso: string | null | undefined): string => {
  if (!iso?.trim()) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso.trim();
  }
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}, ${hh}:${min}`;
};

export const formatHistoryDateTimeLabel = (
  departureDate?: string | null,
  departureTime?: string | null,
  completedAt?: string | null,
  cancelledAt?: string | null,
): string => {
  const cancelled = Boolean(cancelledAt?.trim());
  const dateRaw = departureDate?.trim() ?? '';
  const timeRaw = departureTime?.trim() ?? '';

  const civil = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateRaw);
  const dateLabel = civil
    ? formatDisplayDate(new Date(Number(civil[1]), Number(civil[2]) - 1, Number(civil[3])))
    : dateRaw
      ? formatCivilDateLabel(dateRaw)
      : '';
  const timeLabel = timeRaw ? formatApiDepartureTime(timeRaw) : '';

  const eventLabel = cancelled
    ? formatIsoTimestampLabel(cancelledAt)
    : completedAt?.trim()
      ? formatIsoTimestampLabel(completedAt)
      : '';

  const schedule = [dateLabel, timeLabel].filter(Boolean).join(', ');
  if (eventLabel && schedule) {
    return `${schedule} · ${eventLabel}`;
  }
  return schedule || eventLabel || HISTORY_UNAVAILABLE_LABEL;
};

const resolveRideHistorySource = (dto: RideHistoryItemDto): string =>
  dto.source?.trim() || dto.ride?.source?.trim() || 'Pickup';

const resolveRideHistoryDestination = (dto: RideHistoryItemDto): string =>
  dto.destination?.trim() || dto.ride?.destination?.trim() || 'Drop-off';

const resolveRideHistoryDepartureDate = (dto: RideHistoryItemDto): string =>
  dto.departureDate?.trim() || dto.ride?.departureDate?.trim() || '';

const resolveRideHistoryDepartureTime = (dto: RideHistoryItemDto): string =>
  dto.departureTime?.trim() || dto.ride?.departureTime?.trim() || '';

const resolveRideType = (dto: RideHistoryItemDto): DriverRideKind => {
  const raw = String(dto.rideType ?? dto.ride?.rideType ?? '').trim().toUpperCase();
  if (raw === 'COMMUTE') {
    return 'commute';
  }
  return rideKindFromAssuredFlag(raw === 'ASSURED');
};

const resolveHistoryVehicle = (
  dto: RideHistoryItemDto,
): RideHistoryItemDto['vehicle'] => {
  if (dto.vehicle) {
    return dto.vehicle;
  }
  return dto.ride?.vehicle ?? null;
};

const resolveVehicleLabel = (dto: RideHistoryItemDto): string => {
  const vehicle = resolveHistoryVehicle(dto);
  if (!vehicle) {
    return '';
  }
  const parts = [vehicle.color, vehicle.make, vehicle.model, vehicle.variant]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  return parts.join(' ').trim();
};

const resolveVehiclePlate = (dto: RideHistoryItemDto): string =>
  resolveHistoryVehicle(dto)?.registrationNumber?.trim() || '';

const hasMoneyValue = (raw: number | string | null | undefined): boolean =>
  raw != null && raw !== '';

/** Coerce API number|string metrics so string "18.4" is not treated as missing. */
const coerceFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const resolveEarningsBreakdown = (dto: RideHistoryItemDto): RideHistoryEarningsDto => {
  const record = dto as RideHistoryItemDto & {
    earningsBreakdown?: RideHistoryEarningsDto | null;
  };
  const nested = dto.earnings ?? record.earningsBreakdown ?? {};
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

const resolvePassengerDriverShare = (
  passenger: RideHistoryPassengerEarningDto,
): number | string | null | undefined =>
  passenger.driverShare ?? passenger.driverShareAmount ?? null;

const resolvePassengerFare = (
  passenger: RideHistoryPassengerEarningDto,
): number | string | null | undefined =>
  passenger.fareAmount ?? passenger.totalAmount ?? null;

const resolvePassengerCount = (dto: RideHistoryItemDto): number | null => {
  const fromField = coerceFiniteNumber(dto.passengerCount);
  if (fromField != null && fromField >= 0) {
    return Math.round(fromField);
  }
  if (Array.isArray(dto.passengers) && dto.passengers.length > 0) {
    return dto.passengers.length;
  }
  return null;
};

const resolveHistoryCoords = (
  dto: RideHistoryItemDto,
): {
  pickup: HistoryRideItem['pickup'];
  dropoff: HistoryRideItem['dropoff'];
} => {
  const nested = dto.ride as
    | (NonNullable<RideHistoryItemDto['ride']> & {
        sourceLatitude?: number | string | null;
        sourceLongitude?: number | string | null;
        destinationLatitude?: number | string | null;
        destinationLongitude?: number | string | null;
      })
    | null
    | undefined;

  const pickupLat = coerceFiniteNumber(dto.sourceLatitude ?? nested?.sourceLatitude);
  const pickupLng = coerceFiniteNumber(dto.sourceLongitude ?? nested?.sourceLongitude);
  const dropoffLat = coerceFiniteNumber(
    dto.destinationLatitude ?? nested?.destinationLatitude,
  );
  const dropoffLng = coerceFiniteNumber(
    dto.destinationLongitude ?? nested?.destinationLongitude,
  );

  const pickup =
    pickupLat != null &&
    pickupLng != null &&
    isValidMapCoordinate({ latitude: pickupLat, longitude: pickupLng })
      ? { latitude: pickupLat, longitude: pickupLng }
      : null;

  const dropoff =
    dropoffLat != null &&
    dropoffLng != null &&
    isValidMapCoordinate({ latitude: dropoffLat, longitude: dropoffLng })
      ? { latitude: dropoffLat, longitude: dropoffLng }
      : null;

  return { pickup, dropoff };
};

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
};

const formatDurationLabel = (minutes: number | null | undefined): string => {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) {
    return HISTORY_UNAVAILABLE_LABEL;
  }
  return `${Math.round(minutes)} mins`;
};

const formatDistanceLabel = (km: number | null | undefined): string => {
  if (km == null || !Number.isFinite(km) || km <= 0) {
    return HISTORY_UNAVAILABLE_LABEL;
  }
  // Keep one decimal for typical city hops; round whole km for long routes.
  const rounded = km >= 100 ? Math.round(km) : Math.round(km * 10) / 10;
  return `${rounded} km`;
};

const formatOptionalMoneyLabel = (
  raw: number | string | null | undefined,
  options?: { unavailable?: boolean },
): string => {
  if (raw == null || raw === '') {
    return options?.unavailable ? HISTORY_UNAVAILABLE_LABEL : formatBhaiWayCoins(0);
  }
  const amount = parseMoneySnapshot(raw);
  if (!Number.isFinite(amount)) {
    return HISTORY_UNAVAILABLE_LABEL;
  }
  return formatInrAmount(amount);
};

const resolvePassengerName = (
  passenger: NonNullable<RideHistoryItemDto['passengers']>[number],
): string => {
  const resolved = resolvePersonDisplayName(passenger);
  if (resolved) {
    return resolved;
  }
  return passenger.name?.trim() || 'Passenger';
};

const resolveRideHistoryId = (dto: RideHistoryItemDto): string => {
  const record = dto as RideHistoryItemDto & { rideId?: string; _id?: string };
  return (
    dto.id?.trim() ||
    record.rideId?.trim() ||
    dto.ride?.id?.trim() ||
    record._id?.trim() ||
    ''
  );
};

const resolveRideHistoryDirection = (
  dto: RideHistoryItemDto,
): HistoryRideItem['direction'] => {
  const raw = String(dto.direction ?? dto.ride?.direction ?? '')
    .trim()
    .toUpperCase();
  if (raw === 'RETURN') {
    return 'RETURN';
  }
  if (raw === 'OUTBOUND') {
    return 'OUTBOUND';
  }
  return null;
};

/** GET /rides/history list item → My Rides past card. */
export const mapRideHistoryListItem = (dto: RideHistoryItemDto): HistoryRideItem => {
  const pickupLabel = shortPlaceName(resolveRideHistorySource(dto));
  const dropoffLabel = shortPlaceName(resolveRideHistoryDestination(dto));
  const status = resolveHistoryStatusFromDto(dto);
  const cancelled = status === 'CANCELLED';
  const cancelledAt = resolveHistoryCancelledAt(dto);
  const completedAt = dto.completedAt ?? dto.ride?.completedAt ?? null;
  const { pickup, dropoff } = resolveHistoryCoords(dto);
  const passengerCount = resolvePassengerCount(dto);
  const vehicleLabel = resolveVehicleLabel(dto);
  const earnings = resolveEarningsBreakdown(dto);
  const earningsLabel = hasMoneyValue(earnings.total)
    ? formatOptionalMoneyLabel(earnings.total)
    : undefined;
  const rideId = resolveRideHistoryId(dto);
  const direction = resolveRideHistoryDirection(dto);
  const commute = isCommuteApiRideType(dto.rideType ?? dto.ride?.rideType);

  return {
    id: rideId,
    rideId,
    title:
      cancelled && commute && direction === 'RETURN'
        ? 'Return ride cancelled'
        : cancelled
          ? 'Ride Cancelled'
          : 'Trip Completed',
    routeLabel: `${pickupLabel} → ${dropoffLabel}`,
    dateLabel: formatHistoryDateTimeLabel(
      resolveRideHistoryDepartureDate(dto),
      resolveRideHistoryDepartureTime(dto),
      completedAt,
      cancelledAt,
    ),
    timeLabel: resolveRideHistoryDepartureTime(dto)
      ? formatApiDepartureTime(resolveRideHistoryDepartureTime(dto))
      : undefined,
    statusLabel: mapHistoryStatusLabel(status, { cancelledAt }),
    status,
    pickupLabel,
    dropoffLabel,
    pickup,
    dropoff,
    role: 'driver',
    assured: resolveRideType(dto) === 'assured',
    commute,
    direction,
    seriesId: dto.seriesId ?? dto.ride?.seriesId ?? null,
    occurrenceDate: dto.occurrenceDate ?? dto.ride?.occurrenceDate ?? null,
    passengerCount,
    vehicleLabel: vehicleLabel || undefined,
    plateNumber: resolveVehiclePlate(dto) || undefined,
    earningsLabel,
    cancelledAtLabel: cancelledAt ? formatIsoTimestampLabel(cancelledAt) : undefined,
    sortAtMs: resolveHistoryEndedMs({
      completedAt,
      cancelledAt,
      startedAt: dto.startedAt ?? null,
      departureDate: resolveRideHistoryDepartureDate(dto),
      departureTime: resolveRideHistoryDepartureTime(dto),
      updatedAt: dto.ride?.updatedAt ?? null,
      createdAt: dto.ride?.createdAt ?? null,
    }),
  };
};

const buildMoneyMetaLine = (params: {
  id: string;
  name: string;
  amount: number | string | null | undefined;
  kind: TripDetailsEarningsLine['kind'];
  signedBonus?: boolean;
}): TripDetailsEarningsLine | null => {
  if (!hasMoneyValue(params.amount)) {
    return null;
  }
  const amount = parseMoneySnapshot(params.amount);
  if (!Number.isFinite(amount) || amount === 0) {
    return null;
  }
  return {
    id: params.id,
    name: params.name,
    initials: '',
    tag: '',
    amountLabel: params.signedBonus
      ? formatInrBonus(amount)
      : formatInrAmount(amount),
    kind: params.kind,
  };
};

const buildPassengerEarningsLines = (
  dto: RideHistoryItemDto,
  rideType: DriverRideKind,
): TripDetailsEarningsLine[] => {
  const passengers = Array.isArray(dto.passengers) ? dto.passengers : [];
  const tag = getPassengerRideTag(rideType);

  return passengers.map((passenger, index) => {
    const name = resolvePassengerName(passenger);
    const driverShareRaw = resolvePassengerDriverShare(passenger);
    const fareRaw = resolvePassengerFare(passenger);
    // Driver view prefers driverShare; fall back to booking fare.
    const amountRaw = hasMoneyValue(driverShareRaw) ? driverShareRaw : fareRaw;
    const showFareSubtitle =
      hasMoneyValue(driverShareRaw) &&
      hasMoneyValue(fareRaw) &&
      String(driverShareRaw) !== String(fareRaw);

    return {
      id: passenger.bookingId?.trim() || passenger.passengerId?.trim() || `passenger-${index}`,
      name,
      initials: initialsFromName(name),
      tag,
      amountLabel: formatOptionalMoneyLabel(amountRaw, { unavailable: true }),
      kind: 'passenger' as const,
      subtitle: showFareSubtitle
        ? `${EARNINGS_LABELS.fareSubtitlePrefix} ${formatOptionalMoneyLabel(fareRaw)}`
        : undefined,
    };
  });
};

const buildEarningsBreakdownLines = (
  dto: RideHistoryItemDto,
  rideType: DriverRideKind,
  passengerLines: readonly TripDetailsEarningsLine[],
): TripDetailsEarningsLine[] => {
  const earnings = resolveEarningsBreakdown(dto);
  const lines: TripDetailsEarningsLine[] = [...passengerLines];

  // When there are no passenger rows, surface gross passenger total for transparency.
  if (passengerLines.length === 0) {
    const passengerTotalLine = buildMoneyMetaLine({
      id: 'passenger-total',
      name: EARNINGS_LABELS.passengerTotal,
      amount: earnings.passengerTotal,
      kind: 'meta',
    });
    if (passengerTotalLine) {
      lines.push(passengerTotalLine);
    }
  }

  const platformLine = buildMoneyMetaLine({
    id: 'platform-share',
    name: EARNINGS_LABELS.platformShare,
    amount: earnings.platformShare,
    kind: 'platform',
  });
  if (platformLine) {
    lines.push(platformLine);
  }

  const assuredAmount =
    rideType === 'assured' || hasMoneyValue(earnings.assuredBonus)
      ? earnings.assuredBonus
      : null;
  const assuredLine = buildMoneyMetaLine({
    id: 'assured-bonus',
    name: EARNINGS_LABELS.assuredBonus,
    amount: assuredAmount,
    kind: 'bonus',
    signedBonus: true,
  });
  if (assuredLine) {
    lines.push(assuredLine);
  }

  const otherLine = buildMoneyMetaLine({
    id: 'other-earnings',
    name: EARNINGS_LABELS.otherEarnings,
    amount: earnings.otherEarnings,
    kind: 'other',
    signedBonus: true,
  });
  if (otherLine) {
    lines.push(otherLine);
  }

  return lines;
};

/** GET /rides/history/:id → driver trip details summary. */
export const mapRideHistoryDetail = (
  dto: RideHistoryItemDto,
  avatarUri: string,
): TripDetailsSummary => {
  const rideId = resolveRideHistoryId(dto);
  const rideType = resolveRideType(dto);
  const passengerLines = buildPassengerEarningsLines(dto, rideType);
  const earningsLines = buildEarningsBreakdownLines(dto, rideType, passengerLines);
  const earnings = resolveEarningsBreakdown(dto);

  const totalEarningsLabel = hasMoneyValue(earnings.total)
    ? formatOptionalMoneyLabel(earnings.total)
    : earningsLines.length > 0
      ? formatInrAmount(
          earningsLines.reduce((sum, line) => {
            if (line.kind === 'platform') {
              return sum;
            }
            if (line.amountLabel === HISTORY_UNAVAILABLE_LABEL) {
              return sum;
            }
            const cleaned = line.amountLabel.replace(/[^\d.-]/g, '');
            const value = Number(cleaned);
            return sum + (Number.isFinite(value) ? value : 0);
          }, 0),
        )
      : HISTORY_UNAVAILABLE_LABEL;

  const status = resolveHistoryStatusFromDto(dto);
  const cancelledAt = resolveHistoryCancelledAt(dto);
  const completedAt = dto.completedAt ?? dto.ride?.completedAt ?? null;
  const vehicleName = resolveVehicleLabel(dto);
  const plateNumber = resolveVehiclePlate(dto);
  const historyVehicle = resolveHistoryVehicle(dto);
  const verified = Boolean(historyVehicle?.verified ?? historyVehicle?.isVerified);
  const vehicleType =
    typeof historyVehicle?.vehicleType === 'string'
      ? historyVehicle.vehicleType.trim()
      : '';
  const seatingCapacity = coerceFiniteNumber(historyVehicle?.seatingCapacity);
  const registrationYear = coerceFiniteNumber(historyVehicle?.registrationYear);

  return {
    rideId: rideId || dto.id,
    rideType,
    origin: resolveRideHistorySource(dto),
    destination: resolveRideHistoryDestination(dto),
    dateLabel: formatHistoryDateTimeLabel(
      resolveRideHistoryDepartureDate(dto),
      resolveRideHistoryDepartureTime(dto),
      completedAt,
      cancelledAt,
    ),
    durationLabel: formatDurationLabel(coerceFiniteNumber(dto.durationMinutes)),
    distanceLabel: formatDistanceLabel(coerceFiniteNumber(dto.distanceKm)),
    statusLabel: mapTripDetailsBadgeLabel(status),
    vehicle: {
      name: vehicleName,
      plateNumber,
      verified,
      vehicleType: vehicleType || undefined,
      seatingCapacity,
      registrationYear,
    },
    earningsLines,
    totalEarningsLabel,
    avatarUri,
    pickup: resolveHistoryCoords(dto).pickup,
    dropoff: resolveHistoryCoords(dto).dropoff,
    cancelledAtLabel: cancelledAt ? formatIsoTimestampLabel(cancelledAt) : undefined,
    startedAtLabel: dto.startedAt
      ? formatIsoTimestampLabel(dto.startedAt)
      : undefined,
  };
};