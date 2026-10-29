import type { RideResponseDto } from '@/features/offer-ride/api';
import type { BookingResponseDto } from '@/features/ride-search/api';
import { parsePricePerSeat } from '@/features/ride-search/utils';

const readDepositAmount = (raw: unknown): number => {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  if (typeof raw === 'string' && raw.trim()) {
    return parsePricePerSeat(raw);
  }
  return 0;
};

const readDepositPercentage = (raw: unknown): number | undefined => {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  if (typeof raw === 'string' && raw.trim()) {
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }
  return undefined;
};

/** Rider booking deposit from GET /bookings/:id securityDeposit* fields. */
export const formatBookingSecurityDepositLabel = (
  booking: Pick<
    BookingResponseDto,
    'securityDepositAmount' | 'securityDepositPercentage'
  >,
): string | undefined => {
  const amount = readDepositAmount(booking.securityDepositAmount);
  if (amount > 0) {
    return `₹${amount}`;
  }
  const percentage = readDepositPercentage(booking.securityDepositPercentage);
  if (percentage != null) {
    return `${percentage}%`;
  }
  return undefined;
};

/** Driver assured publish deposit from GET /rides/my ride row. */
export const formatDriverRideSecurityDepositLabel = (
  ride: Pick<RideResponseDto, 'rideType' | 'assuredDepositAmount' | 'assuredDepositPercentage'> | null | undefined,
): string | undefined => {
  if (!ride || ride.rideType !== 'ASSURED') {
    return undefined;
  }
  const amount = readDepositAmount(ride.assuredDepositAmount);
  if (amount > 0) {
    return `₹${amount}`;
  }
  const percentage = readDepositPercentage(ride.assuredDepositPercentage);
  if (percentage != null) {
    return `${percentage}%`;
  }
  return undefined;
};
