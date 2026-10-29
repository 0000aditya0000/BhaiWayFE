export type GstInvoiceViewerRole = 'rider' | 'driver';

const GST_ELIGIBLE_RIDE_TYPES = new Set(['REGULAR', 'COMMUTE']);
const GST_ELIGIBLE_BOOKING_MODES = new Set(['REGULAR', 'COMMUTE']);

const normalize = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toUpperCase();

export interface GstInvoiceEligibilityInput {
  viewerRole: GstInvoiceViewerRole;
  bookingStatus?: string | null;
  rideType?: string | null;
  bookingMode?: string | null;
  passengerUserId?: string | null;
  sessionUserId?: string | null;
}

/**
 * Rider-only GST invoice action for completed Regular/Outstation and Commute bookings.
 * Assured, cancelled, no-show, upcoming/active, and driver views are excluded.
 */
export const isGstInvoiceActionVisible = (input: GstInvoiceEligibilityInput): boolean => {
  if (input.viewerRole !== 'rider') {
    return false;
  }
  if (normalize(input.bookingStatus) !== 'COMPLETED') {
    return false;
  }
  const rideType = normalize(input.rideType);
  const bookingMode = normalize(input.bookingMode);
  if (rideType === 'ASSURED' || bookingMode === 'ASSURED') {
    return false;
  }
  const typeEligible =
    GST_ELIGIBLE_RIDE_TYPES.has(rideType) || GST_ELIGIBLE_BOOKING_MODES.has(bookingMode);
  if (!typeEligible) {
    return false;
  }
  const passengerId = input.passengerUserId?.trim() ?? '';
  const sessionId = input.sessionUserId?.trim() ?? '';
  if (passengerId && sessionId && passengerId !== sessionId) {
    return false;
  }
  return true;
};
