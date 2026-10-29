import type { RideResultItem } from '../../types';

export interface RideResultCardProps {
  ride: RideResultItem;
  /** Opens Ride Details (preview) for Regular and Assured. */
  onBookPress: (ride: RideResultItem) => void;
}
