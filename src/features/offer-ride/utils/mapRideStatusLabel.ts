/** Normalize backend ride status for comparisons. */
export const normalizeRideStatus = (status: string | null | undefined): string =>
  String(status ?? '')
    .trim()
    .toUpperCase();

/**
 * User-facing label for backend ride status.
 * `isBookable` is intentionally NOT used here — bookability ≠ lifecycle status.
 */
export const mapRideStatusLabel = (
  status: string | null | undefined,
  rideType?: 'REGULAR' | 'ASSURED' | string | null,
): string => {
  const value = normalizeRideStatus(status);
  const isAssured = String(rideType ?? '').trim().toUpperCase() === 'ASSURED';

  switch (value) {
    case 'ASSURANCE_ACTIVE':
      return 'Under Assurance';
    case 'ASSURANCE_PENDING':
      return 'Assurance Pending';
    case 'PUBLISHED':
      if (String(rideType ?? '').trim().toUpperCase() === 'COMMUTE') {
        return 'Commute Published';
      }
      return isAssured ? 'Under Assurance' : 'Published';
    case 'IN_PROGRESS':
      return 'Ride In Progress';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      if (!value) {
        return 'Unknown';
      }
      return value
        .split('_')
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ');
  }
};

/** Driver upcoming list — backend statuses that belong on Upcoming (not Past). */
export const isUpcomingDriverRideStatus = (status: string | null | undefined): boolean => {
  const value = normalizeRideStatus(status);
  return (
    value === 'PUBLISHED' ||
    value === 'IN_PROGRESS' ||
    value === 'ASSURANCE_ACTIVE' ||
    value === 'ASSURANCE_PENDING'
  );
};

export const mapDriverUpcomingRideTitle = (ride: {
  status?: string | null;
  rideType?: string | null;
}): string => mapRideStatusLabel(ride.status, ride.rideType);
