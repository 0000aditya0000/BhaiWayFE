import type {
  ApiBookingStatus,
  BookingDriverSnapshotDto,
  BookingPassengerSnapshotDto,
  BookingRideSnapshotDto,
  BookingVehicleSnapshotDto,
} from './bookings.types';

/** GET /bookings/history — optional filter; default COMPLETED + CANCELLED. */
export type BookingHistoryStatusFilter = 'COMPLETED' | 'CANCELLED';

export interface ListBookingHistoryQuery {
  status?: BookingHistoryStatusFilter;
  page?: number;
  limit?: number;
}

/** List + detail from GET /bookings/history and GET /bookings/history/:id */
export interface BookingHistoryItemDto {
  id: string;
  /** Alias some backends send instead of (or in addition to) `id`. */
  bookingId?: string;
  rideId?: string;
  status: ApiBookingStatus | string;
  bookingMode?: string | null;
  seats?: number;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  totalAmount?: number | string | null;
  pricePerSeatSnapshot?: number | string | null;
  securityDepositAmount?: number | string | null;
  invoiceId?: string | null;
  rideFare?: number | string | null;
  platformFee?: number | string | null;
  taxes?: number | string | null;
  gst?: number | string | null;
  promoDiscount?: number | string | null;
  promoCode?: string | null;
  pickupTime?: string | null;
  dropoffTime?: string | null;
  pickupVerifiedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string | null;
  source?: string | null;
  destination?: string | null;
  departureDate?: string | null;
  departureTime?: string | null;
  sourceLatitude?: number | null;
  sourceLongitude?: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  ride?: BookingRideSnapshotDto | null;
  driver?: BookingDriverSnapshotDto | null;
  vehicle?: BookingVehicleSnapshotDto | null;
  passenger?: BookingPassengerSnapshotDto | null;
}

export interface BookingHistoryPageDto {
  items?: BookingHistoryItemDto[];
  bookings?: BookingHistoryItemDto[];
  data?: BookingHistoryItemDto[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasMore?: boolean;
}

export interface BookingHistoryPageResult {
  items: BookingHistoryItemDto[];
  page: number;
  limit: number;
  total: number | null;
  totalPages: number | null;
  hasMore: boolean;
}
