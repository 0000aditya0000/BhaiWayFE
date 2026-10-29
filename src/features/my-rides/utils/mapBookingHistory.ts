import type { BookingHistoryItemDto } from '@/features/ride-search/api/bookingsHistory.types';
import { parseMoneySnapshot } from '@/features/ride-search/api';
import { resolvePersonDisplayName } from '@/features/ride-search/api/bookingPersonName';
import {
  resolveVehicleLabelForRide,
  resolveVehiclePlateForRide,
} from '@/features/ride-search/utils/bookingVehicle';
import { formatApiDepartureTime } from '@/features/ride-search/utils';
import { isValidMapCoordinate } from '@/shared/maps';
import { formatBhaiWayCoins } from '@/shared/utils';

import { DEFAULT_PROFILE_AVATAR } from '../constants';
import type { HistoryRideItem, RideInvoiceFareLine, RideInvoiceSummary } from '../types';
import { isCommuteApiBooking } from './commuteMyRides.utils';
import { formatPaymentMethodLabel } from './mapDriverBooking';
import {
  HISTORY_UNAVAILABLE_LABEL,
  mapHistoryStatusLabel,
  mapInvoiceStatusLabel,
  normalizeHistoryStatus,
} from './historyStatus';
import { formatHistoryDateTimeLabel } from './mapRideHistory';
import { resolveHistoryEndedMs } from './sortMyRides';

const shortPlaceName = (value: string): string => {
  const segment = value.split(',')[0]?.trim();
  return segment && segment.length > 0 ? segment : value;
};

const formatTimeLabel = (iso: string | null | undefined): string => {
  if (!iso?.trim()) {
    return HISTORY_UNAVAILABLE_LABEL;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso.trim();
  }
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

const resolvePickupLabel = (dto: BookingHistoryItemDto): string => {
  const raw =
    dto.source?.trim() ||
    dto.ride?.source?.trim() ||
    '';
  return raw ? shortPlaceName(raw) : 'Pickup';
};

const resolveDropoffLabel = (dto: BookingHistoryItemDto): string => {
  const raw =
    dto.destination?.trim() ||
    dto.ride?.destination?.trim() ||
    '';
  return raw ? shortPlaceName(raw) : 'Drop-off';
};

const resolveDepartureDate = (dto: BookingHistoryItemDto): string =>
  dto.departureDate?.trim() || dto.ride?.departureDate?.trim() || '';

const resolveDepartureTime = (dto: BookingHistoryItemDto): string =>
  dto.departureTime?.trim() || dto.ride?.departureTime?.trim() || '';

const resolveHistoryCoords = (
  dto: BookingHistoryItemDto,
): {
  pickup: HistoryRideItem['pickup'];
  dropoff: HistoryRideItem['dropoff'];
} => {
  const nested = dto.ride as
    | (NonNullable<BookingHistoryItemDto['ride']> & {
        sourceLatitude?: number | null;
        sourceLongitude?: number | null;
        destinationLatitude?: number | null;
        destinationLongitude?: number | null;
      })
    | null
    | undefined;

  const pickupLat = dto.sourceLatitude ?? nested?.sourceLatitude ?? null;
  const pickupLng = dto.sourceLongitude ?? nested?.sourceLongitude ?? null;
  const dropoffLat = dto.destinationLatitude ?? nested?.destinationLatitude ?? null;
  const dropoffLng = dto.destinationLongitude ?? nested?.destinationLongitude ?? null;

  const pickup =
    typeof pickupLat === 'number' &&
    typeof pickupLng === 'number' &&
    isValidMapCoordinate({ latitude: pickupLat, longitude: pickupLng })
      ? { latitude: pickupLat, longitude: pickupLng }
      : null;

  const dropoff =
    typeof dropoffLat === 'number' &&
    typeof dropoffLng === 'number' &&
    isValidMapCoordinate({ latitude: dropoffLat, longitude: dropoffLng })
      ? { latitude: dropoffLat, longitude: dropoffLng }
      : null;

  return { pickup, dropoff };
};

const formatMoneyLabel = (
  raw: number | string | null | undefined,
  options?: { minimumFractionDigits?: number; discount?: boolean },
): string | null => {
  if (raw == null || raw === '') {
    return null;
  }
  const amount = parseMoneySnapshot(raw);
  if (!Number.isFinite(amount)) {
    return null;
  }
  const formatted = formatBhaiWayCoins(Math.abs(amount), {
    spaced: false,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
  });
  if (options?.discount && amount !== 0) {
    return amount < 0 ? formatted : `-${formatted}`;
  }
  return formatted;
};

const asTrimmed = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const resolveBookingHistoryId = (
  dto: BookingHistoryItemDto,
  fallbackBookingId?: string,
): string => {
  const record = dto as BookingHistoryItemDto & {
    bookingId?: string;
    _id?: string;
    booking?: { id?: string; bookingId?: string } | null;
  };
  return (
    asTrimmed(dto.id) ||
    asTrimmed(record.bookingId) ||
    asTrimmed(record.booking?.id) ||
    asTrimmed(record.booking?.bookingId) ||
    asTrimmed(record._id) ||
    asTrimmed(fallbackBookingId) ||
    ''
  );
};

/** GET /bookings/history list item → My Rides past card. */
export const mapBookingHistoryListItem = (dto: BookingHistoryItemDto): HistoryRideItem => {
  const pickupLabel = resolvePickupLabel(dto);
  const dropoffLabel = resolveDropoffLabel(dto);
  const status = normalizeHistoryStatus(dto.status);
  const cancelled = status === 'CANCELLED';
  const { pickup, dropoff } = resolveHistoryCoords(dto);
  const assured =
    dto.bookingMode === 'ASSURED' || dto.ride?.rideType === 'ASSURED';
  const totalLabel = formatMoneyLabel(dto.totalAmount, { minimumFractionDigits: 2 });
  const bookingId = resolveBookingHistoryId(dto);

  return {
    id: bookingId,
    bookingId,
    rideId: dto.rideId?.trim() || dto.ride?.id?.trim() || undefined,
    title: cancelled ? 'Booking Cancelled' : 'Trip Completed',
    routeLabel: `${pickupLabel} → ${dropoffLabel}`,
    dateLabel: formatHistoryDateTimeLabel(
      resolveDepartureDate(dto),
      resolveDepartureTime(dto),
      dto.completedAt,
      dto.cancelledAt,
    ),
    timeLabel: resolveDepartureTime(dto)
      ? formatApiDepartureTime(resolveDepartureTime(dto))
      : undefined,
    statusLabel: mapHistoryStatusLabel(dto.status, { cancelledAt: dto.cancelledAt }),
    status,
    pickupLabel,
    dropoffLabel,
    pickup,
    dropoff,
    role: 'rider',
    assured,
    commute: isCommuteApiBooking(dto),
    vehicleLabel: resolveVehicleLabelForRide(dto.rideId ?? '', dto.vehicle) || undefined,
    plateNumber: resolveVehiclePlateForRide(dto.rideId ?? '', dto.vehicle) || undefined,
    earningsLabel: totalLabel ?? undefined,
    cancelledAtLabel: dto.cancelledAt ? formatTimeLabel(dto.cancelledAt) : undefined,
    sortAtMs: resolveHistoryEndedMs({
      completedAt: dto.completedAt,
      cancelledAt: dto.cancelledAt,
      dropoffTime: dto.dropoffTime,
      pickupVerifiedAt: dto.pickupVerifiedAt,
      pickupTime: dto.pickupTime,
      departureDate: resolveDepartureDate(dto),
      departureTime: resolveDepartureTime(dto),
      createdAt: dto.createdAt,
    }),
  };
};

const buildFareLines = (dto: BookingHistoryItemDto): RideInvoiceFareLine[] => {
  const lines: RideInvoiceFareLine[] = [];
  const pushLine = (
    id: string,
    label: string,
    raw: number | string | null | undefined,
    tone?: RideInvoiceFareLine['tone'],
  ) => {
    const amountLabel = formatMoneyLabel(raw, {
      minimumFractionDigits: 2,
      discount: tone === 'discount',
    });
    if (!amountLabel) {
      return;
    }
    lines.push({ id, label, amountLabel, tone });
  };

  pushLine('ride-fare', 'Ride Fare', dto.rideFare ?? dto.pricePerSeatSnapshot);
  pushLine('platform-fee', 'Platform Fee', dto.platformFee);
  pushLine('taxes', 'Taxes (GST)', dto.taxes ?? dto.gst);

  if (dto.promoDiscount != null && dto.promoDiscount !== '') {
    const promoLabel = dto.promoCode?.trim()
      ? `Promo Discount (${dto.promoCode.trim()})`
      : 'Promo Discount';
    pushLine('promo', promoLabel, dto.promoDiscount, 'discount');
  }

  pushLine('security-deposit', 'Security Deposit', dto.securityDepositAmount);

  return lines;
};

/** GET /bookings/history/:id → rider invoice summary. */
export const mapBookingHistoryDetail = (
  dto: BookingHistoryItemDto,
  avatarUri: string,
  fallbackBookingId?: string,
): RideInvoiceSummary => {
  const bookingId = resolveBookingHistoryId(dto, fallbackBookingId);
  const driverName = resolvePersonDisplayName(dto.driver) || HISTORY_UNAVAILABLE_LABEL;
  const vehicleLabel =
    resolveVehicleLabelForRide(dto.rideId ?? '', dto.vehicle) || HISTORY_UNAVAILABLE_LABEL;
  const plateNumber =
    resolveVehiclePlateForRide(dto.rideId ?? '', dto.vehicle) || HISTORY_UNAVAILABLE_LABEL;
  const driverPhoto = dto.driver?.profilePhoto?.trim() || DEFAULT_PROFILE_AVATAR;
  const verified = Boolean(dto.driver?.verified ?? dto.vehicle?.verified);

  const totalAmountLabel =
    formatMoneyLabel(dto.totalAmount, { minimumFractionDigits: 2 }) ??
    HISTORY_UNAVAILABLE_LABEL;
  const paidAmountLabel = totalAmountLabel;

  const fareLines = buildFareLines(dto);
  const paymentMethod = formatPaymentMethodLabel(String(dto.paymentMethod ?? ''));
  const invoiceId = dto.invoiceId?.trim() || HISTORY_UNAVAILABLE_LABEL;

  const dateLabel = formatHistoryDateTimeLabel(
    resolveDepartureDate(dto),
    resolveDepartureTime(dto),
    dto.completedAt,
    dto.cancelledAt,
  );

  const pickupTimeRaw =
    dto.pickupTime?.trim() ||
    dto.pickupVerifiedAt?.trim() ||
    null;
  const dropoffTimeRaw = dto.dropoffTime?.trim() || dto.completedAt?.trim() || null;

  return {
    id: bookingId,
    bookingId,
    rideId: dto.rideId?.trim() || dto.ride?.id?.trim() || '',
    invoiceId,
    dateLabel,
    statusLabel: mapInvoiceStatusLabel(dto.status),
    totalAmountLabel,
    paidAmountLabel,
    pickupLabel: resolvePickupLabel(dto),
    pickupTimeLabel: pickupTimeRaw ? formatTimeLabel(pickupTimeRaw) : HISTORY_UNAVAILABLE_LABEL,
    dropoffLabel: resolveDropoffLabel(dto),
    dropoffTimeLabel: dropoffTimeRaw ? formatTimeLabel(dropoffTimeRaw) : HISTORY_UNAVAILABLE_LABEL,
    driver: {
      name: driverName,
      vehicleLabel,
      plateNumber,
      avatarUri: driverPhoto,
      verified,
    },
    fareLines,
    paymentMethodLabel: paymentMethod || HISTORY_UNAVAILABLE_LABEL,
    avatarUri: avatarUri || DEFAULT_PROFILE_AVATAR,
    cancelledAtLabel: dto.cancelledAt ? formatTimeLabel(dto.cancelledAt) : undefined,
  };
};
