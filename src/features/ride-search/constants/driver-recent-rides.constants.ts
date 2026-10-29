/** Driver recent-ride history from GET /rides/search and GET /rides/public/:id. */

export type DriverRecentRideStatusId = 'completed' | 'cancelled';

export interface DriverRecentRideStatusItem {
  id: string;
  /** Newest-first among the last 5 rides. */
  status: DriverRecentRideStatusId;
  label: string;
  dateLabel: string;
  routeLabel: string;
}

export const DRIVER_RECENT_RIDES_UI = {
  cardTitle: 'Last 5 rides',
  detailsTitle: 'Driver’s last 5 rides',
  detailsSubtitle: 'Recent completed and cancelled trips.',
  emptyLabel: 'No recent rides yet.',
} as const;

export const DRIVER_RECENT_RIDE_STATUS_META: Record<
  DriverRecentRideStatusId,
  { label: string; color: string; background: string; icon: string }
> = {
  completed: {
    label: 'Completed',
    color: '#166534',
    background: '#DCFCE7',
    icon: 'checkmark-circle',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#B91C1C',
    background: '#FEE2E2',
    icon: 'close-circle',
  },
};
