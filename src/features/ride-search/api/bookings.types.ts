/** Swagger-aligned booking types for passenger Regular + Assured flows. */

export type ApiBookingPaymentMethod =
  | 'PAY_LATER'
  | 'PAY_NOW'
  | 'ASSURED_DEPOSIT'
  | 'WALLET'
  | 'PAY_AFTER_RIDE';

/** Assured fare timing — separate from the mandatory ASSURED_DEPOSIT hold. */
export type ApiAssuredFarePayment = 'PAY_NOW' | 'PAY_LATER';

export type ApiBookingStatus =
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'PENDING'
  | string;

export type ApiPaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | string;

export type ApiSecurityDepositStatus = 'HELD' | 'NONE' | string;

export type ApiBookingMode = 'REGULAR' | 'ASSURED' | 'COMMUTE' | string;

/** Passenger pickup lifecycle (Regular Ride trip). */
export type ApiPickupStatus =
  | 'WAITING_FOR_PICKUP'
  | 'PICKED_UP'
  | string;

/**
 * Client create body — never send passengerId, price, status, or totals.
 * Assured: paymentMethod must be ASSURED_DEPOSIT; optional farePayment selects fare timing.
 * Regular: WALLET (prepaid) or PAY_AFTER_RIDE. Backend canonicalizes to PAY_NOW / PAY_LATER.
 * Never send farePayment, fare, payable amount, wallet balance, or client discounts.
 */
export interface CreateBookingDto {
  rideId: string;
  seats: number;
  paymentMethod: ApiBookingPaymentMethod;
  /** Assured only: PAY_NOW debits fare; PAY_LATER (default) leaves fare UNPAID. */
  farePayment?: ApiAssuredFarePayment;
  /**
   * Catalog coupon code. Applied server-side to the charge selected by couponChargeScope.
   * Never trust client discount amounts — server computes the benefit.
   */
  couponCode?: string;
  /**
   * Which charge the coupon applies to.
   * Assured deposit bookings default to ASSURED_SECURITY_DEPOSIT;
   * PAY_NOW / COMMUTE fare defaults to RIDE_FARE.
   * BOTH is not accepted at apply-time — pick one charge.
   */
  couponChargeScope?: 'RIDE_FARE' | 'ASSURED_SECURITY_DEPOSIT';
}

export interface BookingRideSnapshotDto {
  id: string;
  rideType: 'REGULAR' | 'ASSURED' | 'COMMUTE' | string;
  status?: string;
  source: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  maxTwoInBackSeat?: boolean | null;
  noSmoking?: boolean | null;
  noPets?: boolean | null;
  luggageAllowed?: boolean | null;
  womenOnly?: boolean | null;
  preferences?: {
    maxTwoInBackSeat?: boolean | null;
    noSmoking?: boolean | null;
    noPets?: boolean | null;
    luggageAllowed?: boolean | null;
    womenOnly?: boolean | null;
  } | null;
  passengers?: readonly BookingCoPassengerSnapshotDto[] | null;
  coPassengers?: readonly BookingCoPassengerSnapshotDto[] | null;
  bookedPassengers?: readonly BookingCoPassengerSnapshotDto[] | null;
}

export interface BookingDriverSnapshotDto {
  id?: string;
  displayName?: string | null;
  /** Profile-style fields — backend may return these instead of displayName. */
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  fullName?: string | null;
  /** Preferred photo field. Runtime payloads may send a Cloudinary object instead of a string. */
  profilePhoto?: string | null;
  profilePicture?: string | null;
  photo?: string | null;
  avatarUrl?: string | null;
  verified?: boolean | null;
  /** Contact — wire Call only when backend sends an explicit value. */
  phone?: string | null;
  phoneNumber?: string | null;
  mobile?: string | null;
}

export interface BookingVehicleSnapshotDto {
  id?: string;
  make?: string;
  model?: string;
  variant?: string | null;
  color?: string | null;
  vehicleType?: string;
  /** Present when backend embeds full vehicle snapshot on booking responses. */
  registrationNumber?: string | null;
  verified?: boolean | null;
  isVerified?: boolean | null;
}

export interface BookingCoPassengerSnapshotDto {
  id?: string;
  bookingId?: string;
  passengerId?: string;
  displayName?: string | null;
  name?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profilePhoto?: string | null;
  company?: string | null;
  verified?: boolean | null;
  isVerified?: boolean | null;
  seats?: number | null;
  passenger?: BookingPassengerSnapshotDto | null;
}

export interface BookingPassengerSnapshotDto {
  id?: string;
  displayName?: string | null;
  /** Profile-style fields — backend may return these instead of displayName. */
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  fullName?: string | null;
  profilePhoto?: string | null;
  /** Only map when backend sends an explicit boolean. */
  isVerified?: boolean;
  verified?: boolean;
  /** Contact fields — never invent; wire Call only when present. */
  phone?: string | null;
  phoneNumber?: string | null;
  mobile?: string | null;
}

/** Swagger: BookingResponseDto */
export interface BookingResponseDto {
  id: string;
  rideId: string;
  passengerId: string;
  seats: number;
  status: ApiBookingStatus;
  paymentMethod: ApiBookingPaymentMethod | string;
  paymentStatus: ApiPaymentStatus;
  pricePerSeatSnapshot: string;
  /** Commute rider fare per seat at booking time. */
  riderPricePerSeatSnapshot?: string | null;
  /** Commute driver fare per seat at booking time. */
  driverPricePerSeatSnapshot?: string | null;
  /** Commute settlement — driver share (accounting; not shown to passengers). */
  driverShareAmount?: string | null;
  /** Commute settlement — platform share (accounting; not shown to passengers). */
  platformShareAmount?: string | null;
  totalAmount: string;
  /** Assured ride fare amount (integer coin string) when present. */
  fareAmount?: string | null;
  /** Assured fare timing choice echoed from create. */
  farePayment?: ApiAssuredFarePayment | string | null;
  /** Assured fare settlement status (separate from deposit hold). */
  farePaymentStatus?: ApiPaymentStatus | null;
  securityDepositAmount?: string | null;
  securityDepositPercentage?: number | null;
  securityDepositStatus?: ApiSecurityDepositStatus | null;
  bookingMode: ApiBookingMode;
  /**
   * Pickup OTP — present only on passenger-owned booking responses
   * (GET /bookings/my, GET /bookings/:id as the booking owner).
   * Driver list responses must NOT include this field.
   */
  pickupOtp?: string | null;
  pickupStatus?: ApiPickupStatus | null;
  pickupVerifiedAt?: string | null;
  pickupOrder?: number | null;
  ride?: BookingRideSnapshotDto | null;
  driver?: BookingDriverSnapshotDto | null;
  vehicle?: BookingVehicleSnapshotDto | null;
  /** Present on driver booking list when backend includes passenger summary. */
  passenger?: BookingPassengerSnapshotDto | null;
  /**
   * Other riders on the same ride — when backend embeds them on passenger booking detail.
   * Also accepts `fellowPassengers`, `otherPassengers`, or `otherBookings` (parsed in mapper).
   */
  coPassengers?: readonly BookingCoPassengerSnapshotDto[] | null;
  fellowPassengers?: readonly BookingCoPassengerSnapshotDto[] | null;
  otherPassengers?: readonly BookingCoPassengerSnapshotDto[] | null;
  /** Full booking rows for other passengers on the same ride. */
  otherBookings?: readonly BookingResponseDto[] | null;
  /**
   * Ride chat conversation when backend embeds it on booking payloads.
   * Prefer nested conversation.id / chat.conversationId when present.
   */
  conversationId?: string | null;
  conversation?: {
    id?: string | null;
    status?: string | null;
  } | null;
  chat?: {
    id?: string | null;
    conversationId?: string | null;
    status?: string | null;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Paginated driver booking list (docs: DriverBookingPageDto).
 * Unwrap accepts items | bookings | data | results | raw array.
 */
export interface DriverBookingPageDto {
  items?: BookingResponseDto[];
  bookings?: BookingResponseDto[];
  data?: BookingResponseDto[];
  results?: BookingResponseDto[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ListMyBookingsResponse {
  items?: BookingResponseDto[];
  bookings?: BookingResponseDto[];
  data?: BookingResponseDto[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

/** Query for GET /bookings/driver/my-rides — never send driverId. */
export interface ListDriverBookingsQuery {
  rideId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Response from POST /bookings/:id/accept.
 * Backend may include bookings auto-cancelled when the ride became full.
 */
export interface AcceptBookingResultDto extends BookingResponseDto {
  booking?: BookingResponseDto;
  autoCancelledBookings?: BookingResponseDto[];
  autoCancelledBookingIds?: string[];
}

/**
 * Response from POST /bookings/:id/cancel.
 * Backend stores lifecycle reason as RIDER_CANCELLED (UI reasons are not sent).
 * Regular bookings return a minimal payload; Assured adds forfeiture/compensation fields.
 */
export interface CancelBookingResultDto {
  bookingId?: string;
  id?: string;
  rideId?: string;
  status?: ApiBookingStatus;
  cancellationReason?: string;
  seatsRestored?: number | null;
  partialFillCompensation?: unknown;
  alreadyApplied?: boolean;
  /** Assured passenger cancel — backend authoritative coin amounts (1 Coin = ₹1). */
  securityDepositForfeited?: string | null;
  farePayment?: ApiAssuredFarePayment | string | null;
  fareRefunded?: string | null;
  /** Optional when backend exposes total fare paid (PAY_NOW). */
  fareAmount?: string | null;
  driverCompensation?: string | null;
  platformAmount?: string | null;
  nextAssuredDepositPercentage?: number | null;
}

/** Assured passenger POST /bookings/:id/cancel — full lifecycle response. */
export type AssuredPassengerCancelResultDto = CancelBookingResultDto & {
  securityDepositForfeited: string;
  farePayment: ApiAssuredFarePayment | string;
  driverCompensation: string;
};

/** Body for POST /bookings/:id/verify-pickup */
export interface VerifyPickupDto {
  otp: string;
}

/**
 * Docs: POST /bookings/:id/verify-pickup — owning driver of the ride.
 * Driver never receives pickupOtp in any response.
 */
export interface VerifyPickupResultDto {
  bookingId?: string;
  rideId?: string;
  status?: ApiBookingStatus;
  pickupStatus?: ApiPickupStatus;
  pickupVerifiedAt?: string | null;
  pickupOrder?: number | null;
  alreadyVerified?: boolean;
}

/** Payment channel returned by post-trip PAY_LATER settlement endpoints. */
export type PayLaterPaymentChannel = 'WALLET' | 'CASH' | string;

/**
 * Response from POST /bookings/:id/pay-wallet and POST /bookings/:id/pay-cash.
 * Backend is authoritative for all amounts.
 */
export interface PayLaterPaymentResponse {
  bookingId: string;
  fareAmount: string;
  paymentStatus: ApiPaymentStatus;
  passengerDebited: string;
  driverCredited: string;
  paymentChannel: PayLaterPaymentChannel;
  alreadySettled: boolean;
  transactionId: string;
  paidAt: string;
}

/** Parsed insufficient-wallet error for post-trip fare settlement. */
export interface PayLaterInsufficientWalletDetails {
  requiredAmount?: string;
  availableBalance?: string;
  message: string;
}
