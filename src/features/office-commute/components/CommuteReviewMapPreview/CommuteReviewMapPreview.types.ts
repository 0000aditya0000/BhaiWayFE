import type { MapCoordinate } from '@/features/ride-search/types';

export interface CommuteReviewMapPreviewProps {
  pickup?: MapCoordinate | null;
  dropoff?: MapCoordinate | null;
  pickupLabel?: string;
  dropoffLabel?: string;
  routeCoordinates: MapCoordinate[];
  distanceLabel: string;
  durationLabel: string;
  distanceCaption: string;
  loading?: boolean;
}
